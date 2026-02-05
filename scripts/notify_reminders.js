const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');
const vapidKeys = require('../vapid.json');

// Configuración de Supabase (Reemplazar con variables de entorno)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

webpush.setVapidDetails(
    'mailto:carlosdaniel092015@gmail.com',
    vapidKeys.pub,
    vapidKeys.priv
);

async function notifyReminders() {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Obtener recordatorios pendientes
    const { data: reminders, error: remError } = await supabase
        .from('reminders')
        .select('*')
        .eq('status', 'pendiente')
        .or(`last_notified_at.is.null,last_notified_at.neq.${todayStr}`);

    if (remError) {
        console.error('Error fetching reminders:', remError);
        return;
    }

    for (const reminder of reminders) {
        const [y, m, d] = reminder.date.split('-').map(Number);
        const dueDate = new Date(y, m - 1, d);
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 7) {
            // 2. Obtener suscripción del usuario
            const { data: subs, error: subError } = await supabase
                .from('push_subscriptions')
                .select('subscription')
                .eq('user_id', reminder.user_id);

            if (subError || !subs) continue;

            for (const s of subs) {
                try {
                    await webpush.sendNotification(s.subscription, JSON.stringify({
                        title: '¡Recordatorio de Pago!',
                        body: `${reminder.description}: $${reminder.amount} vence en ${diffDays} días.`,
                        url: '/'
                    }));
                } catch (err) {
                    console.error('Error sending push:', err);
                }
            }

            // 3. Actualizar last_notified_at
            await supabase
                .from('reminders')
                .update({ last_notified_at: todayStr })
                .eq('id', reminder.id);
        }
    }
}

notifyReminders();
