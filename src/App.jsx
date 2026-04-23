import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Trash2, TrendingUp, TrendingDown, DollarSign, LogOut, Wallet, PiggyBank, Calendar, Layout, Clock, Settings, Search, Bell, CreditCard, ChevronLeft, ChevronRight, Camera, FileText, X, CheckCircle2, Lock, Mail, Briefcase, Tags } from 'lucide-react';
import { supabase } from './supabaseClient';
import Tesseract from 'tesseract.js';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
// import html2canvas from 'html2canvas';

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement, Title,
  PointElement, LineElement
);

// Mover constantes fuera del componente para evitar advertencias de dependencias en Hooks
const AUTHORIZED_EMAILS = ['carlosdaniel092015@gmail.com', 'stephanymartinezjaquez30@gmail.com'];
const REMINDERS_AUTHORIZED_EMAIL = 'carlosdaniel092015@gmail.com';
const BUSINESS_AUTHORIZED_EMAIL = 'acentos.decoventas@gmail.com';

export default function FinanceTracker() {

  const [currentUser, setCurrentUser] = useState(null);

  const [showLogin, setShowLogin] = useState(true);

  const [isRegistering, setIsRegistering] = useState(false);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const [registerForm, setRegisterForm] = useState({ email: '', password: '', confirmPassword: '' });

  const [loginError, setLoginError] = useState('');

  const [loading, setLoading] = useState(true);

  const [transactions, setTransactions] = useState([]);

  const [transactionType, setTransactionType] = useState('gasto');

  const [amount, setAmount] = useState('');

  const [category, setCategory] = useState('');

  const [description, setDescription] = useState('');

  const [status, setStatus] = useState('pendiente');

  // const [dateFilter, setDateFilter] = useState('mes');

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [savings, setSavings] = useState([]);

  const [savingName, setSavingName] = useState('');

  const [savingAmount, setSavingAmount] = useState('');

  const [savingDate, setSavingDate] = useState(new Date().toISOString().split('T')[0]);

  const [showSavingsModule, setShowSavingsModule] = useState(false);

  const [activeTab, setActiveTab] = useState('finanzas');

  const [reminders, setReminders] = useState([]);

  const [reminderName, setReminderName] = useState('');

  const [reminderAmount, setReminderAmount] = useState('');

  const [reminderDueDate, setReminderDueDate] = useState('');

  const [reminderCategory, setReminderCategory] = useState('');

  const [reminderFrequency, setReminderFrequency] = useState('unica');

  const [showRemindersModule, setShowRemindersModule] = useState(false);

  const [reminderFilter] = useState('todos');
  const [reminderDateFilter] = useState('mes');
  const [reminderSelectedDate] = useState(new Date());

  // Estados para módulo empresarial
  const [showBusinessModule, setShowBusinessModule] = useState(false);
  const [businessTransactions, setBusinessTransactions] = useState([]);
  const [businessType, setBusinessType] = useState('ingreso');
  const [businessAmount, setBusinessAmount] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [businessClient, setBusinessClient] = useState('');
  const [businessInvoice, setBusinessInvoice] = useState('');
  const [businessStatus, setBusinessStatus] = useState('pendiente');
  const [businessDateFilter] = useState('mes');
  const [businessSelectedDate] = useState(new Date());

  // Estados para notificaciones
  const [notificationsEnabled, setNotificationsEnabled] = useState('default');
  const [showNotificationConfig, setShowNotificationConfig] = useState(false);
  const [, setInstallPrompt] = useState(null);


  const [viewMode, setViewMode] = useState('daily'); // daily, calendar, weekly, monthly, summary
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]); // Array of {url, preview, file}
  const [categoryEditType, setCategoryEditType] = useState('gasto');
  const [newCategoryName, setNewCategoryName] = useState('');

  const VAPID_PUBLIC_KEY = 'BKRApo1ItUND05_-VfyO5t4NIZkZQTAVMRrCSqb4fpEJgkdNITq356YwxyhuP2N0u_-lvHOb5tVMlnXvZuTvzZ4';

  const [annualRate, setAnnualRate] = useState(() => {
    const saved = localStorage.getItem('annualReturnRate');
    return saved ? parseFloat(saved) : 0.11;
  });

  useEffect(() => {
    localStorage.setItem('annualReturnRate', annualRate);
  }, [annualRate]);

  const [dynamicCategories, setDynamicCategories] = useState(() => {
    const saved = localStorage.getItem('app_categories_v2');
    if (saved) return JSON.parse(saved);
    return {
      gasto: ['Pasaje', 'Préstamos', 'Tarjetas', 'Alquiler', 'Comidas', 'Streaming', 'Agua', 'Luz', 'Internet', 'Imprevistos', 'Salud', 'Gym', 'Gasolina', 'Vehículo', 'Vacaciones', 'Niños', 'Plan', 'Compras', 'Deportes'],
      ingreso: ['Ahorros', 'Salario', 'Quincena', 'Quincena + Incentivo', 'Otros', 'Depósito', 'Comisiones', 'Remesas'],
      business_ingreso: ['Ventas', 'Servicios', 'Productos', 'Comisiones', 'Consultoría', 'Alquiler de equipos', 'Otros ingresos'],
      business_egreso: ['Nómina', 'Alquiler', 'Servicios públicos', 'Compra de inventario', 'Marketing', 'Transporte', 'Equipos', 'Mantenimiento', 'Impuestos', 'Seguros', 'Otros gastos'],
      reminder: ['Préstamos', 'Tarjetas de Crédito', 'Agua', 'Luz', 'Internet', 'Teléfono', 'Cable/TV', 'Streaming', 'Alquiler', 'Seguro', 'Otros']
    };
  });

  useEffect(() => {
    localStorage.setItem('app_categories_v2', JSON.stringify(dynamicCategories));
  }, [dynamicCategories]);

  const addCategory = (type, name) => {
    if (!name.trim()) return;
    setDynamicCategories(prev => ({
      ...prev,
      [type]: [...new Set([...prev[type], name.trim()])]
    }));
  };

  const editCategory = (type, oldName, newName) => {
    if (!newName.trim() || oldName === newName) return;
    setDynamicCategories(prev => ({
      ...prev,
      [type]: prev[type].map(cat => cat === oldName ? newName.trim() : cat)
    }));
  };

  const deleteCategory = (type, name) => {
    setDynamicCategories(prev => ({
      ...prev,
      [type]: prev[type].filter(cat => cat !== name)
    }));
  };

  const [editingCategory, setEditingCategory] = useState(null); // { type, name }
  const [editCategoryInputValue, setEditCategoryInputValue] = useState('');

  const handleUserChange = useCallback((user) => {
    if (user) {
      setCurrentUser(user);
      setShowLogin(false);

      if ('Notification' in window) {
        setNotificationsEnabled(Notification.permission);
      }

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        setInstallPrompt(e);
      });
      const isAuthorized = AUTHORIZED_EMAILS.includes(user.email);
      const isBusinessAuthorized = user.email === BUSINESS_AUTHORIZED_EMAIL;
      const userApp = user.user_metadata?.app;
if (userApp && userApp !== 'finanzas') {
  await supabase.auth.signOut();
  setLoginError('No tienes acceso a esta aplicación');
  setLoading(false);
  return;
}
      setShowSavingsModule(isAuthorized && !isBusinessAuthorized);
      setShowRemindersModule(user.email === REMINDERS_AUTHORIZED_EMAIL);
      setShowBusinessModule(isBusinessAuthorized || user.email === 'carlosdaniel092015@gmail.com');

      if (isBusinessAuthorized) {
        setActiveTab('empresa');
      }
    } else {
      setCurrentUser(null);
      setShowLogin(true);
      setShowSavingsModule(false);
      setShowRemindersModule(false);
      setShowBusinessModule(false);
    }
    setLoading(false);
  }, []); // <--- CORREGIDO: Array de dependencias vacío para evitar advertencia de ESLint

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      handleUserChange(user);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      handleUserChange(user);
    });

    return () => subscription.unsubscribe();
  }, [handleUserChange]);

  const fetchTransactions = useCallback(async () => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching transactions:', error);
    else setTransactions(data);
  }, [currentUser]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const fetchSavings = useCallback(async () => {
    if (!currentUser || !showSavingsModule) return;
    const { data, error } = await supabase
      .from('savings')
      .select('*')
      .order('date', { ascending: false });

    if (error) console.error('Error fetching savings:', error);
    else setSavings(data);
  }, [currentUser, showSavingsModule]);

  useEffect(() => {
    fetchSavings();
  }, [fetchSavings]);

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Si viene en formato ISO (con T), extraemos solo la parte de la fecha
    const datePart = dueDate.split('T')[0];
    const [y, m, d] = datePart.split('-').map(Number);
    const due = new Date(y, m - 1, d);

    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const checkRemindersAndNotify = useCallback(async (remindersList) => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const todayStr = new Date().toLocaleDateString('en-CA');
    const registration = await navigator.serviceWorker.ready;

    for (const reminder of remindersList) {
      if (reminder.status !== 'pendiente') continue;

      const daysUntil = getDaysUntilDue(reminder.dueDate);

      // Notificar una semana antes (daysUntil <= 7) 
      // y seguir notificando diariamente (si last_notified_at !== todayStr)
      if (daysUntil <= 7 && reminder.last_notified_at !== todayStr) {
        const title = daysUntil < 0 ? '¡Pago Vencido!' : '¡Recordatorio de Pago!';
        const body = daysUntil < 0
          ? `${reminder.description}: $${formatCurrency(reminder.amount)} venció hace ${Math.abs(daysUntil)} días.`
          : `${reminder.description}: $${formatCurrency(reminder.amount)} vence en ${daysUntil} días.`;

        await registration.showNotification(title, {
          body,
          icon: '/logo192.png',
          badge: '/logo192.png',
          vibrate: [200, 100, 200],
          tag: `reminder-${reminder.id}`, // Evita duplicados en la bandeja
          renotify: true
        });

        // Actualizar last_notified_at en Supabase
        await supabase
          .from('reminders')
          .update({ last_notified_at: todayStr })
          .eq('id', reminder.id);
      }
    }
  }, []);

  const fetchReminders = useCallback(async () => {
    if (!currentUser || !showRemindersModule) return;
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('date', { ascending: true });

    if (error) console.error('Error fetching reminders:', error);
    else {
      const mapped = data.map(r => ({ ...r, dueDate: r.date, name: r.description }));
      setReminders(mapped);
      checkRemindersAndNotify(mapped);
    }
  }, [currentUser, showRemindersModule, checkRemindersAndNotify]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);


  const fetchBusinessTransactions = useCallback(async () => {
    if (!currentUser || !showBusinessModule) return;
    const { data, error } = await supabase
      .from('business_transactions')
      .select('*')
      .eq('user_id', currentUser.id);

    if (error) console.error('Error fetching business transactions:', error);
    else setBusinessTransactions(data);
  }, [currentUser, showBusinessModule]);

  useEffect(() => {
    fetchBusinessTransactions();
  }, [fetchBusinessTransactions]);


  // Verificar y crear recordatorios mensuales automáticamente
  useEffect(() => {
    if (!currentUser || !showRemindersModule || reminders.length === 0) return;

    let isProcessing = false;
    const checkAndCreateMonthlyReminders = async () => {
      if (isProcessing) return;
      isProcessing = true;
      try {
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth();
        const firstDayOfMonth = new Date(y, m, 1);
        const lastDayOfMonth = new Date(y, m + 1, 0);

        for (const reminder of reminders) {
          if (reminder.frequency !== 'mensual') continue;

          // Verificar si ya existe una transacción para este recordatorio en el mes actual
          const { data: existingTransactions, error: fetchError } = await supabase
            .from('transactions')
            .select('id, date')
            .eq('user_id', currentUser.id)
            .eq('reminder_id', reminder.id);

          if (fetchError) throw fetchError;

          const hasTransactionThisMonth = existingTransactions.some(t => {
            const transDate = new Date(t.date);
            return transDate >= firstDayOfMonth && transDate <= lastDayOfMonth;
          });

          if (!hasTransactionThisMonth) {
            // Crear transacción para el día 1 del mes actual
            await supabase.from('transactions').insert({
              user_id: currentUser.id,
              type: 'gasto',
              amount: reminder.amount,
              category: reminder.category,
              description: `${reminder.name} (Pago mensual automático)`,
              status: 'pendiente',
              date: firstDayOfMonth.toISOString(),
              from_reminder: true,
              reminder_id: reminder.id
            });

            // Actualizar la fecha del recordatorio para el próximo vencimiento (opcional pero ayuda a la UI)
            const nextDueDate = new Date(y, m, new Date(reminder.dueDate).getDate());
            if (nextDueDate < today) {
              nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            }

            await supabase.from('reminders').update({
              date: nextDueDate.toISOString().split('T')[0]
            }).eq('id', reminder.id);

            console.log(`Recordatorio mensual procesado para este mes: ${reminder.name}`);
            await fetchTransactions();
          }
        }
      } catch (err) {
        console.error('Error en checkAndCreateMonthlyReminders:', err);
      } finally {
        isProcessing = false;
      }
    };

    checkAndCreateMonthlyReminders();
    const interval = setInterval(checkAndCreateMonthlyReminders, 3600000); // Cada hora
    return () => clearInterval(interval);
  }, [currentUser, showRemindersModule, reminders, fetchTransactions]);


  const handleRegister = async () => {
    setLoginError('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setLoginError('Las contraseñas no coinciden');
      return;
    }

    if (!registerForm.email || !registerForm.password) {
      setLoginError('Completa todos los campos');
      return;
    }

    if (registerForm.password.length < 6) {
      setLoginError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
  email: registerForm.email,
  password: registerForm.password,
  options: {
    data: {
      app: 'finanzas'
    }
  }
});

      if (error) throw error;

      setRegisterForm({ email: '', password: '', confirmPassword: '' });
      setIsRegistering(false);
      setLoginError('');
      alert('Registro exitoso. Por favor verifica tu correo electrónico.');
    } catch (error) {
      setLoginError(error.message || 'Error al registrarse. Intenta nuevamente.');
    }
  };


  const handleLogin = async () => {
    setLoginError('');

    if (!loginForm.email || !loginForm.password) {
      setLoginError('Completa todos los campos');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) throw error;

      setLoginForm({ email: '', password: '' });
    } catch (error) {
      setLoginError('Contraseña o usuario inválido');
    }
  };


  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setTransactions([]);
      setSavings([]);
      setReminders([]);
      setBusinessTransactions([]);
      setActiveTab('finanzas');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };


  const addReminder = async () => {
    if (!reminderName || !reminderAmount || !reminderDueDate || !reminderCategory) {
      alert('Por favor completa todos los campos');
      return;
    }

    const cleanAmount = reminderAmount.replace(/,/g, '').replace(/[^\d.]/g, '');
    const numericAmount = parseFloat(cleanAmount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    try {
      const { data: reminderData, error: reminderError } = await supabase
        .from('reminders')
        .insert({
          user_id: currentUser.id,
          description: reminderName,
          amount: numericAmount,
          // Fix: Parse local date to preserve day
          date: (() => {
            const [y, m, d] = reminderDueDate.split('-').map(Number);
            return new Date(y, m - 1, d).toISOString();
          })(),
          category: reminderCategory,
          frequency: reminderFrequency,
          status: 'pendiente'
        })
        .select()
        .single();

      if (reminderError) throw reminderError;

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: currentUser.id,
          type: 'gasto',
          amount: numericAmount,
          category: reminderCategory,
          description: `${reminderName} (Recordatorio)`,
          status: 'pendiente',
          date: (() => {
            // Also use the reminder date for the transaction created
            const [y, m, d] = reminderDueDate.split('-').map(Number);
            return new Date(y, m - 1, d).toISOString();
          })(),
          from_reminder: true,
          reminder_id: reminderData.id
        });

      if (transactionError) throw transactionError;

      await fetchReminders();
      await fetchTransactions();

      setReminderName('');
      setReminderAmount('');
      setReminderDueDate('');
      setReminderCategory('');
      setReminderFrequency('unica');
      alert('Recordatorio y transacción agregados exitosamente');
    } catch (error) {
      console.error('Error al agregar recordatorio:', error);
      alert('Error al agregar el recordatorio: ' + error.message);
    }
  };


  const deleteReminder = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este recordatorio? También se eliminarán todas las transacciones generadas automáticamente por él.')) {
      return;
    }

    try {
      // Supabase RLS/cascade should ideally handle this, but we'll do it explicitly
      await supabase.from('transactions').delete().eq('reminder_id', id);
      const { error } = await supabase.from('reminders').delete().eq('id', id);

      if (error) throw error;

      await fetchReminders();
      await fetchTransactions();
    } catch (error) {
      console.error('Error al eliminar recordatorio:', error);
      alert('Error al realizar la eliminación');
    }
  };


  const toggleReminderStatus = async (id, currentStatus, reminder) => {
    try {
      const newStatus = currentStatus === 'pagado' ? 'pendiente' : 'pagado';

      const { error: reminderError } = await supabase
        .from('reminders')
        .update({ status: newStatus })
        .eq('id', id);

      if (reminderError) throw reminderError;

      const { error: transactionError } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('reminder_id', id);

      if (transactionError) throw transactionError;

      await fetchReminders();
      await fetchTransactions();
      alert(newStatus === 'pagado' ? 'Marcado como pagado' : 'Marcado como pendiente');
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Error al actualizar el estado');
    }
  };


  const handleReminderAmountInput = (value) => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }

    let formatted = parts[0];
    if (formatted) {
      formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    if (parts.length === 2) {
      formatted = formatted + '.' + parts[1].slice(0, 2);
    }

    setReminderAmount(formatted);
  };


  const filterReminders = () => {
    return reminders.filter(reminder => {
      if (reminderFilter === 'todos') return true;
      const daysUntil = getDaysUntilDue(reminder.dueDate);

      if (reminderFilter === 'pendientes') {
        return reminder.status === 'pendiente' && daysUntil > 7;
      } else if (reminderFilter === 'pronto') {
        return reminder.status === 'pendiente' && daysUntil >= 0 && daysUntil <= 7;
      } else if (reminderFilter === 'vencidos') {
        return reminder.status === 'pendiente' && daysUntil < 0;
      } else if (reminderFilter === 'pagados') {
        return reminder.status === 'pagado';
      }

      return true;
    });
  };

  const filterRemindersByDate = () => {
    const filtered = filterReminders();
    const now = new Date(reminderSelectedDate);

    return filtered.filter(r => {
      // Parse YYYY-MM-DD string to Local Midnight to avoid UTC shift
      const [y, m, d] = r.dueDate.split('-').map(Number);
      const reminderDate = new Date(y, m - 1, d);

      if (reminderDateFilter === 'dia') {
        return reminderDate.toDateString() === now.toDateString();
      } else if (reminderDateFilter === 'mes') {
        return reminderDate.getMonth() === now.getMonth() &&
          reminderDate.getFullYear() === now.getFullYear();
      } else if (reminderDateFilter === 'ano') {
        return reminderDate.getFullYear() === now.getFullYear();
      } else {
        // Caso 'todos' o cualquier otro valor
        return true;
      }
    });
  };

  const addTransaction = async () => {
    if (!amount || !category) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      // Upload images first
      const imageUrls = uploadedImages.length > 0 ? await uploadImagesToStorage() : [];

      const { error } = await supabase.from('transactions').insert({
        user_id: currentUser.id,
        type: transactionType,
        amount: parseFloat(amount),
        category,
        description,
        status: transactionType === 'ingreso' ? 'pagado' : status,
        date: new Date().toISOString(),
        from_reminder: false,
        receipt_images: imageUrls
      });

      if (error) throw error;

      await fetchTransactions(); // Update list immediately

      setAmount('');
      setCategory('');
      setDescription('');
      setUploadedImages([]);
    } catch (error) {
      console.error('Error al agregar transacción:', error);
      alert('Error al agregar la transacción');
    }
  };


  const deleteTransaction = async (id, transaction) => {
    try {
      if (transaction.from_reminder && transaction.reminder_id) {
        if (window.confirm('Esta transacción está vinculada a un recordatorio. ¿Deseas eliminar ambos?')) {
          await supabase.from('reminders').delete().eq('id', transaction.reminder_id);
        }
      }

      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      await fetchTransactions();
      await fetchReminders();
    } catch (error) {
      console.error('Error al eliminar transacción:', error);
      alert('Error al eliminar la transacción');
    }
  };


  const toggleStatus = async (id, currentStatus, transaction) => {
    try {
      const newStatus = currentStatus === 'pagado' ? 'pendiente' : 'pagado';
      const { error: transError } = await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', id);

      if (transError) throw transError;

      if (transaction.from_reminder && transaction.reminder_id) {
        await supabase
          .from('reminders')
          .update({ status: newStatus })
          .eq('id', transaction.reminder_id);
      }

      await fetchTransactions();
      await fetchReminders();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Error al actualizar el estado');
    }
  };


  const addSaving = async () => {
    if (!savingAmount || !savingName) {
      alert('Por favor completa el nombre y el monto');
      return;
    }

    const cleanAmount = savingAmount.replace(/,/g, '').replace(/[^\d.]/g, '');
    const numericAmount = parseFloat(cleanAmount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    try {
      const { error } = await supabase.from('savings').insert({
        user_id: currentUser.id,
        title: savingName,
        amount: numericAmount,
        // Fix: Parse local date to preserve day
        date: (() => {
          const [y, m, d] = savingDate.split('-').map(Number);
          return new Date(y, m - 1, d).toISOString();
        })()
      });

      if (error) throw error;

      await fetchSavings();

      setSavingName('');
      setSavingAmount('');
      setSavingDate(new Date().toISOString().split('T')[0]);
      alert('Ahorro agregado exitosamente');
    } catch (error) {
      console.error('Error al agregar ahorro:', error);
      alert('Error al agregar el ahorro: ' + error.message);
    }
  };


  const deleteSaving = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este ahorro?')) {
      return;
    }

    try {
      const { error } = await supabase.from('savings').delete().eq('id', id);
      if (error) throw error;
      await fetchSavings();
    } catch (error) {
      console.error('Error al eliminar ahorro:', error);
      alert('Error al eliminar el ahorro');
    }
  };


  const calculateCompoundInterest = () => {
    const sortedSavings = [...savings].sort((a, b) => new Date(a.date) - new Date(b.date));
    let history = [];
    let accumulated = 0;
    let totalInterest = 0;

    sortedSavings.forEach((saving) => {
      // Parse YYYY-MM-DD string to Local Midnight
      const [y, m, d] = saving.date.split('-').map(Number);
      const savingDate = new Date(y, m - 1, d);
      const today = new Date();
      const daysElapsed = Math.max(0, Math.floor((today - savingDate) / (1000 * 60 * 60 * 24)));
      const yearsElapsed = daysElapsed / 365;

      const dailyRate = Math.pow(1 + annualRate, 1 / 365) - 1;
      const amountWithInterest = saving.amount * Math.pow(1 + dailyRate, daysElapsed);
      const interestEarned = amountWithInterest - saving.amount;

      accumulated += amountWithInterest;
      totalInterest += interestEarned;

      history.push({
        ...saving,
        daysElapsed,
        yearsElapsed: yearsElapsed.toFixed(2),
        interestEarned,
        currentValue: amountWithInterest,
        accumulatedTotal: accumulated
      });
    });

    return { history, totalInterest, totalInvested: sortedSavings.reduce((sum, s) => sum + s.amount, 0), accumulated };
  };


  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  /*
  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };
  */

  const requestNotificationPermission = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      alert('Tu navegador no soporta notificaciones o service workers');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission);

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;

        // Suscribirse al servicio de Push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        // Guardar en Supabase
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: currentUser.id,
            subscription: subscription,
            device_info: navigator.userAgent
          }, { onConflict: 'user_id' });

        if (error) {
          console.error('Error guardando suscripción:', error);
          alert('Permiso otorgado pero error al vincular el equipo. Asegúrate de que la tabla push_subscriptions existe.');
        } else {
          alert('¡Equipo vinculado con éxito para notificaciones nativas!');
        }
      }
    } catch (error) {
      console.error('Error en notificaciones:', error);
      alert('Error al activar notificaciones: ' + error.message);
    }
  };

  const formatCurrency = (value) => {
    return "RD$ " + (value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const generatePDFReport = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const dateStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Title
    doc.setFontSize(22);
    doc.setTextColor(59, 130, 246); // Primary color
    doc.text('Finanzas Pro - Reporte Mensual', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${dateStr}`, pageWidth / 2, 28, { align: 'center' });

    // Summary Section
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text('Resumen General', 14, 45);

    autoTable(doc, {
      startY: 50,
      head: [['Concepto', 'Monto']],
      body: [
        ['Ingresos Totales', formatCurrency(totalIngresos)],
        ['Gastos Totales', formatCurrency(totalGastos)],
        ['Balance Neto', formatCurrency(balance)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Transactions Table
    doc.text('Historial de Transacciones', 14, doc.lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Fecha', 'Categoría', 'Descripción', 'Tipo', 'Estado', 'Monto']],
      body: filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString(),
        t.category,
        t.description || '-',
        t.type === 'ingreso' ? 'Ingreso' : 'Gasto',
        t.status === 'pagado' ? 'Pagado' : 'Pendiente',
        formatCurrency(t.amount)
      ]),
      headStyles: { fillColor: [59, 130, 246] }
    });

    // Savings Table (if any)
    if (savings.length > 0) {
      doc.addPage();
      doc.text('Inversiones y Ahorros', 14, 20);
      const { history, accumulated } = calculateCompoundInterest();
      autoTable(doc, {
        startY: 25,
        head: [['Nombre', 'Fecha Inicio', 'Monto Base', 'Ganancia', 'Valor Actual']],
        body: history.map(s => [
          s.name,
          new Date(s.date).toLocaleDateString(),
          formatCurrency(s.amount),
          formatCurrency(s.interestEarned),
          formatCurrency(s.currentValue)
        ]),
        foot: [['', '', 'TOTAL PATRIMONIO', '', formatCurrency(accumulated)]],
        headStyles: { fillColor: [16, 185, 129] } // Income color
      });
    }

    // Business Table (if any)
    if (businessTransactions.length > 0) {
      doc.addPage();
      doc.text('Módulo Empresarial', 14, 20);
      autoTable(doc, {
        startY: 25,
        head: [['Fecha', 'Tipo', 'Categoría', 'Cliente', 'Estado', 'Monto']],
        body: businessTransactions.map(t => [
          new Date(t.date).toLocaleDateString(),
          t.type === 'ingreso' ? 'Venta' : 'Costo',
          t.category,
          t.client_name || '-',
          t.status === 'pagado' ? 'Pagado' : 'Pendiente',
          formatCurrency(t.amount)
        ]),
        headStyles: { fillColor: [99, 102, 241] }
      });
    }

    // Reminders Table (if any)
    if (reminders.length > 0) {
      doc.addPage();
      doc.text('Seguimiento de Recordatorios y Pagos', 14, 20);
      autoTable(doc, {
        startY: 25,
        head: [['Servicio/Pago', 'Vencimiento', 'Frecuencia', 'Estado', 'Monto']],
        body: reminders.map(r => [
          r.name,
          new Date(r.dueDate).toLocaleDateString(),
          r.frequency === 'mensual' ? 'Mensual' : 'Única',
          r.status === 'pagado' ? 'Pagado' : 'Pendiente',
          formatCurrency(r.amount)
        ]),
        headStyles: { fillColor: [245, 158, 11] } // Orange/Yellow for reminders
      });
    }

    // Capture Charts
    const chartElements = document.querySelectorAll('canvas');
    if (chartElements.length > 0) {
      doc.addPage();
      doc.text('Análisis de Tendencias y Distribución', 14, 20);

      let currentY = 30;
      for (let i = 0; i < Math.min(chartElements.length, 3); i++) {
        try {
          const canvas = chartElements[i];
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 180;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (currentY + imgHeight > 280) {
            doc.addPage();
            currentY = 20;
          }

          doc.addImage(imgData, 'PNG', 15, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 10;
        } catch (e) {
          console.error('Error capturing chart for PDF:', e);
        }
      }
    }

    doc.save(`Reporte_Finanzas_${dateStr}.pdf`);
  };

  /*
  const handleAmountInput = (value) => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }
    let formatted = parts[0];
    if (formatted) {
      formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    if (parts.length === 2) {
      formatted = formatted + '.' + parts[1].slice(0, 2);
    }
    setSavingAmount(formatted);
  };
  */

  // Funciones del módulo empresarial
  const addBusinessTransaction = async () => {
    if (!businessAmount || !businessCategory) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    const cleanAmount = businessAmount.replace(/,/g, '').replace(/[^\d.]/g, '');
    const numericAmount = parseFloat(cleanAmount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    try {
      const { error } = await supabase.from('business_transactions').insert({
        user_id: currentUser.id,
        type: businessType,
        amount: numericAmount,
        category: businessCategory,
        description: businessDescription,
        client_name: businessClient,
        invoice_number: businessInvoice,
        status: businessStatus,
        date: new Date().toISOString()
      });

      if (error) throw error;

      await fetchBusinessTransactions();

      setBusinessAmount('');
      setBusinessCategory('');
      setBusinessDescription('');
      setBusinessClient('');
      setBusinessInvoice('');
      setBusinessStatus('pendiente');
      alert('Transacción empresarial agregada exitosamente');
    } catch (error) {
      console.error('Error al agregar transacción empresarial:', error);
      alert('Error al agregar la transacción');
    }
  };

  const deleteBusinessTransaction = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta transacción?')) {
      return;
    }

    try {
      const { error } = await supabase.from('business_transactions').delete().eq('id', id);
      if (error) throw error;
      await fetchBusinessTransactions();
    } catch (error) {
      console.error('Error al eliminar transacción:', error);
      alert('Error al eliminar la transacción');
    }
  };

  const toggleBusinessStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'pagado' ? 'pendiente' : 'pagado';
      const { error } = await supabase
        .from('business_transactions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchBusinessTransactions();
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('Error al actualizar el estado');
    }
  };

  const handleBusinessAmountInput = (value) => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;

    let formatted = parts[0];
    if (formatted) {
      formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    if (parts.length === 2) {
      formatted = formatted + '.' + parts[1].slice(0, 2);
    }

    setBusinessAmount(formatted);
  };

  /*
  const filterBusinessTransactionsByDate = () => {
    const now = new Date(businessSelectedDate);
    return businessTransactions.filter(t => {
      // Parse ISO string (UTC) as Local Date explicitly
      const [y, m, d] = t.date.split('T')[0].split('-').map(Number);
      const transDate = new Date(y, m - 1, d);
      if (businessDateFilter === 'dia') {
        return transDate.toDateString() === now.toDateString();
      } else if (businessDateFilter === 'mes') {
        return transDate.getMonth() === now.getMonth() &&
          transDate.getFullYear() === now.getFullYear();
      } else {
        return transDate.getFullYear() === now.getFullYear();
      }
    });
  };
  */


  const handleOCRFile = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsOCRProcessing(true);

    try {
      // Process first file for OCR
      const file = files[0];

      // Create preview URLs for all files
      const newImages = files.map(f => ({
        file: f,
        preview: URL.createObjectURL(f),
        url: null // Will be set after upload
      }));

      setUploadedImages(prev => [...prev, ...newImages]);

      // Only do OCR on images, not PDFs
      if (file.type.startsWith('image/')) {
        const { data: { text } } = await Tesseract.recognize(file, 'spa+eng');

        // Buscar monto
        const amountRegex = /(?:total|monto|importe|sum|pagar).*?(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/i;
        const amountMatch = text.match(amountRegex);

        if (amountMatch) {
          setAmount(amountMatch[1].replace(',', ''));
        } else {
          // Fallback: buscar cualquier número decimal grande
          const prices = text.match(/\d{1,6}[.,]\d{2}/g);
          if (prices) {
            const maxPrice = Math.max(...prices.map(p => parseFloat(p.replace(',', ''))));
            setAmount(maxPrice.toString());
          }
        }

        // Buscar descripción (usar primera línea significativa)
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
        if (lines.length > 0) {
          setDescription(lines[0].substring(0, 50));
        }

        // Intentar categorizar
        const lowText = text.toLowerCase();
        if (lowText.includes('super') || lowText.includes('comida') || lowText.includes('restaurante')) setCategory('Comidas');
        else if (lowText.includes('uber') || lowText.includes('didi') || lowText.includes('gasolin')) setCategory('Pasaje');
        else if (lowText.includes('farmacia') || lowText.includes('medico') || lowText.includes('clinica')) setCategory('Salud');
      }
    } catch (err) {
      console.error("OCR Error:", err);
      alert("No se pudo extraer la información automáticamente.");
    } finally {
      setIsOCRProcessing(false);
    }
  };

  const removeImage = (index) => {
    setUploadedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const uploadImagesToStorage = async () => {
    const uploadedUrls = [];

    for (const img of uploadedImages) {
      if (img.url) {
        uploadedUrls.push(img.url);
        continue;
      }

      const fileName = `${currentUser.id}/${Date.now()}_${img.file.name}`;
      /*
            const { data, error } = await supabase.storage
              .from('receipts')
              .upload(fileName, img.file);
      */
      const { error } = await supabase.storage
        .from('receipts')
        .upload(fileName, img.file);

      if (error) {
        console.error('Error uploading image:', error);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };


  const filterTransactionsByDate = () => {
    const now = new Date(selectedDate);

    return transactions.filter(t => {
      const [y, m, d] = t.date.split('T')[0].split('-').map(Number);
      const transDate = new Date(y, m - 1, d);

      if (viewMode === 'daily') {
        return transDate.toDateString() === now.toDateString();
      } else if (viewMode === 'weekly') {
        // Show current week (Sunday to Saturday)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return transDate >= startOfWeek && transDate <= endOfWeek;
      } else {
        // monthly, calendar, summary -> Show full month
        return transDate.getMonth() === now.getMonth() &&
          transDate.getFullYear() === now.getFullYear();
      }
    });
  };

  const filteredTransactions = filterTransactionsByDate();

  const totalIngresos = filteredTransactions
    .filter(t => t.type === 'ingreso' && t.status === 'pagado')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalGastos = filteredTransactions
    .filter(t => t.type === 'gasto' && t.status === 'pagado')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIngresos - totalGastos;


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-2xl">Cargando...</div>
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Ambient Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-income/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-dark-card/50 backdrop-blur-xl border border-dark-border/50 rounded-[40px] p-8 sm:p-10 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-primary/30 mb-6 rotate-3">
              <DollarSign className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
              Bienvenido a <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-income">Finanzas Pro</span>
            </h1>
            <p className="text-gray-400 text-sm font-medium">Gestiona tu imperio financiero</p>
          </div>

          {!isRegistering ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {loginError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs font-bold text-center">
                  {loginError}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleLogin}
                  className="w-full bg-primary hover:bg-blue-600 text-white rounded-2xl py-4 font-black uppercase tracking-widest shadow-lg shadow-primary/25 active:scale-[0.98] transition-all"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => { setIsRegistering(true); setLoginError(''); }}
                  className="w-full bg-transparent hover:bg-white/5 text-gray-400 hover:text-white rounded-2xl py-3 text-sm font-bold transition-all"
                >
                  Crear Cuenta Nueva
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-income transition-colors" />
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:border-income focus:ring-1 focus:ring-income outline-none transition-all"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-income transition-colors" />
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:border-income focus:ring-1 focus:ring-income outline-none transition-all"
                    placeholder="Contraseña (mín 6 caracteres)"
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-income transition-colors" />
                  <input
                    type="password"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-600 focus:border-income focus:ring-1 focus:ring-income outline-none transition-all"
                    placeholder="Confirmar contraseña"
                  />
                </div>
              </div>

              {loginError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs font-bold text-center">
                  {loginError}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleRegister}
                  className="w-full bg-income hover:bg-green-600 text-white rounded-2xl py-4 font-black uppercase tracking-widest shadow-lg shadow-income/25 active:scale-[0.98] transition-all"
                >
                  Registrarme
                </button>
                <button
                  onClick={() => { setIsRegistering(false); setLoginError(''); }}
                  className="w-full bg-transparent hover:bg-white/5 text-gray-400 hover:text-white rounded-2xl py-3 text-sm font-bold transition-all"
                >
                  Ya tengo cuenta
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Credit */}
        <p className="absolute bottom-6 text-gray-600 text-xs font-medium uppercase tracking-widest opacity-50">
          Finanzas Personales v2.0
        </p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-dark font-outfit text-dark-text pb-20">
      {/* Dynamic Header */}
      <div className="bg-dark-card/80 backdrop-blur-lg border-b border-dark-border sticky top-0 z-50 px-4 py-3">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-2 rounded-xl">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">
                {activeTab === 'finanzas' ? 'Transacciones' :
                  activeTab === 'ahorros' ? 'Ahorros' :
                    activeTab === 'recordatorios' ? 'Recordatorios' : 'Empresa'}
              </h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-none">
                {selectedDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowNotificationConfig(!showNotificationConfig)} className="relative p-2 text-gray-400 hover:text-white transition">
              <Bell className="w-5 h-5" />
              {reminders.some(r => r.status === 'pendiente' && getDaysUntilDue(r.dueDate) <= 7) && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-expense rounded-full"></span>
              )}
            </button>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-expense transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Scrollable Tabs (Optional for extra filtering like in screenshot) */}
        {activeTab === 'finanzas' && (
          <div className="max-w-md mx-auto mt-4 flex gap-6 text-sm font-medium border-b border-dark-border overflow-x-auto no-scrollbar">
            {['daily', 'weekly', 'monthly', 'summary'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`pb-2 capitalize whitespace-nowrap transition-all px-1 ${viewMode === mode ? 'text-primary border-b-2 border-primary' : 'text-gray-500'
                  }`}
              >
                {mode === 'daily' ? 'Diario' :
                  mode === 'calendar' ? 'Calendario' :
                    mode === 'weekly' ? 'Semanal' :
                      mode === 'monthly' ? 'Mensual' : 'Resumen'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="max-w-md mx-auto px-4 py-6">
        {activeTab === 'finanzas' ? (
          <div className="space-y-6">
            {viewMode === 'daily' ? (
              <>
                {/* Premium Card Balance */}
                <div className="bg-dark-card rounded-3xl p-6 border border-dark-border shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <div className="space-y-1">
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Balance Neto</p>
                        <h2 className="text-4xl font-extrabold font-outfit tracking-tight">{formatCurrency(balance)}</h2>
                      </div>
                      <div className="bg-primary/20 p-4 rounded-2xl border border-primary/20 backdrop-blur-sm">
                        <Wallet className="w-6 h-6 text-primary" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-dark/40 rounded-2xl p-4 border border-dark-border/50 backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-income/10 flex items-center justify-center">
                            <TrendingUp className="w-3 h-3 text-income" />
                          </div>
                          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Ingresos</span>
                        </div>
                        <p className="text-xl font-bold text-income leading-none">{formatCurrency(totalIngresos)}</p>
                      </div>
                      <div className="bg-dark/40 rounded-2xl p-4 border border-dark-border/50 backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-expense/10 flex items-center justify-center">
                            <TrendingDown className="w-3 h-3 text-expense" />
                          </div>
                          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Gastos</span>
                        </div>
                        <p className="text-xl font-bold text-expense leading-none">{formatCurrency(totalGastos)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Reminders (Compact) */}
                {reminders.filter(r => r.status === 'pendiente' && r.dueDate.startsWith(selectedDate.toISOString().split('-').slice(0, 2).join('-'))).length > 0 && (
                  <div className="space-y-3 pb-2">
                    <div className="flex items-center gap-2 px-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <h3 className="font-bold text-white uppercase tracking-widest text-[10px]">Pagos Pendientes este Mes</h3>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar px-1 py-1">
                      {reminders
                        .filter(r => r.status === 'pendiente' && r.dueDate.startsWith(selectedDate.toISOString().split('-').slice(0, 2).join('-')))
                        .map(reminder => {
                          const days = getDaysUntilDue(reminder.dueDate);
                          return (
                            <div key={reminder.id} className={`min-w-[160px] bg-dark-card border rounded-2xl p-3 shadow-lg ${days < 0 ? 'border-expense/50' : 'border-dark-border'}`}>
                              <div className="flex justify-between items-start mb-2">
                                <p className="text-[10px] font-black text-white truncate w-24 uppercase tracking-tighter">{reminder.name}</p>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${days < 0 ? 'bg-expense text-white' : 'bg-primary/20 text-primary'}`}>
                                  {days < 0 ? 'Vencido' : `${days}d`}
                                </span>
                              </div>
                              <p className="text-sm font-black text-white leading-none">${formatCurrency(reminder.amount)}</p>
                              <button
                                onClick={() => toggleReminderStatus(reminder.id, 'pendiente', reminder)}
                                className="w-full mt-2 text-[8px] font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 py-1.5 rounded-lg border border-dark-border transition-all"
                              >
                                Marcar Pago
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Date Slider / Timeline Indicator */}
                <div className="flex items-center justify-between px-2 pt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-white uppercase tracking-widest text-[10px]">Historial de Movimientos</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() - 1);
                      setSelectedDate(newDate);
                    }} className="p-1 hover:text-primary transition"><ChevronLeft className="w-5 h-5" /></button>
                    <span className="text-xs font-bold text-gray-400 min-w-[80px] text-center">
                      {selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                    <button onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() + 1);
                      setSelectedDate(newDate);
                    }} className="p-1 hover:text-primary transition"><ChevronRight className="w-5 h-5" /></button>
                  </div>
                </div>

                {/* Transaction List */}
                <div className="space-y-4">
                  {filteredTransactions.length === 0 ? (
                    <div className="bg-dark-card/30 rounded-3xl p-16 text-center border-2 border-dashed border-dark-border">
                      <div className="w-16 h-16 bg-dark-card rounded-full flex items-center justify-center mx-auto mb-4 border border-dark-border shadow-lg">
                        <Search className="w-6 h-6 text-gray-700" />
                      </div>
                      <h4 className="text-white font-bold mb-1">Sin movimientos</h4>
                      <p className="text-gray-500 text-[10px] uppercase tracking-widest">Registra algo nuevo</p>
                    </div>
                  ) : (
                    filteredTransactions.map((transaction, index) => (
                      <div
                        key={transaction.id}
                        className="bg-dark-card border border-dark-border rounded-3xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all hover:bg-dark-border/20 shadow-xl"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${transaction.type === 'ingreso' ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'
                            }`}>
                            {transaction.type === 'ingreso' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              {transaction.from_reminder && <Clock className="w-3 h-3 text-primary" />}
                              <p className="text-sm font-bold text-white tracking-tight">{transaction.category}</p>
                              {transaction.status === 'pendiente' && (
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium truncate max-w-[150px]">
                              {transaction.description || 'Sin detalles'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-base font-black font-mono tracking-tighter ${transaction.type === 'ingreso' ? 'text-income' : 'text-expense'
                            }`}>
                            {transaction.type === 'ingreso' ? '+' : '-'}${formatCurrency(transaction.amount)}
                          </p>
                          <div className="flex items-center justify-end gap-3 mt-1">
                            <button
                              onClick={() => toggleStatus(transaction.id, transaction.status, transaction)}
                              className={`text-[8px] font-bold uppercase tracking-widest transition-colors ${transaction.status === 'pagado' ? 'text-income' : 'text-yellow-500 underline underline-offset-4'
                                }`}
                            >
                              {transaction.status}
                            </button>
                            <button onClick={() => deleteTransaction(transaction.id, transaction)} className="text-gray-700 hover:text-expense transition opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : viewMode === 'weekly' || viewMode === 'monthly' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-white uppercase tracking-widest text-[10px]">
                      {viewMode === 'weekly' ? 'Vista Semanal' : 'Vista Mensual'}
                    </h3>
                  </div>
                </div>

                {filteredTransactions.length === 0 ? (
                  <div className="bg-dark-card/30 rounded-3xl p-16 text-center border-2 border-dashed border-dark-border">
                    <Search className="w-6 h-6 text-gray-700 mx-auto mb-4" />
                    <h4 className="text-white font-bold mb-1">Sin movimientos</h4>
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest">En este periodo</p>
                  </div>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="bg-dark-card border border-dark-border rounded-3xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all hover:bg-dark-border/20 shadow-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${transaction.type === 'ingreso' ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'
                          }`}>
                          {transaction.type === 'ingreso' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white tracking-tight">{transaction.category}</p>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">{new Date(transaction.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-medium truncate max-w-[150px]">
                            {transaction.description || 'Sin detalles'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-base font-black font-mono tracking-tighter ${transaction.type === 'ingreso' ? 'text-income' : 'text-expense'
                          }`}>
                          {transaction.type === 'ingreso' ? '+' : '-'}${formatCurrency(transaction.amount)}
                        </p>
                        <div className="flex items-center justify-end gap-3 mt-1">
                          <button
                            onClick={() => toggleStatus(transaction.id, transaction.status, transaction)}
                            className={`text-[8px] font-bold uppercase tracking-widest transition-colors ${transaction.status === 'pagado' ? 'text-income' : 'text-yellow-500 underline underline-offset-4'
                              }`}
                          >
                            {transaction.status}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : viewMode === 'summary' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Stats Header */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black text-white">Análisis Mensual</h2>
                  <div className="flex justify-center gap-4">
                    <span className="text-[10px] font-bold text-income bg-income/10 px-3 py-1 rounded-full uppercase">Ingresos: {formatCurrency(totalIngresos)}</span>
                    <span className="text-[10px] font-bold text-expense bg-expense/10 px-3 py-1 rounded-full uppercase">Gastos: {formatCurrency(totalGastos)}</span>
                  </div>
                  <button
                    onClick={generatePDFReport}
                    className="mx-auto mt-4 bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/30 transition-all active:scale-95"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Descargar PDF</span>
                  </button>
                </div>

                {/* Pie Chart */}
                <div className="bg-dark-card rounded-3xl p-6 border border-dark-border shadow-2xl flex flex-col items-center">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Distribución de Gastos</p>
                  <div className="w-full max-w-[250px]">
                    {(() => {
                      const categoryTotals = {};
                      filteredTransactions.filter(t => t.type === 'gasto').forEach(t => {
                        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
                      });
                      const labels = Object.keys(categoryTotals);
                      const data = Object.values(categoryTotals);

                      if (labels.length === 0) return <p className="text-center text-gray-500 text-xs py-10 italic uppercase tracking-tighter">Sin datos suficientes</p>;

                      return (
                        <Pie
                          data={{
                            labels: labels,
                            datasets: [{
                              data: data,
                              backgroundColor: [
                                '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'
                              ],
                              borderWidth: 0,
                              hoverOffset: 15
                            }]
                          }}
                          options={{
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: { color: '#9ca3af', font: { family: 'Outfit', size: 10 }, padding: 20 }
                              }
                            }
                          }}
                        />
                      );
                    })()}
                  </div>
                </div>

                <div className="bg-dark-card rounded-3xl p-6 border border-dark-border shadow-2xl">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6">Tendencia diaria (Gastos)</p>
                  {(() => {
                    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
                    const dailyData = Array(daysInMonth).fill(0).map((_, i) => ({ day: i + 1, total: 0 }));

                    // Use ALL transactions for the month for the chart
                    transactions.filter(t => {
                      const tDate = new Date(t.date);
                      return t.type === 'gasto' &&
                        tDate.getMonth() === selectedDate.getMonth() &&
                        tDate.getFullYear() === selectedDate.getFullYear();
                    }).forEach(t => {
                      const day = new Date(t.date).getDate();
                      if (dailyData[day - 1]) dailyData[day - 1].total += t.amount;
                    });

                    return (
                      <Bar
                        height={150}
                        data={{
                          labels: dailyData.map(d => d.day),
                          datasets: [{
                            label: 'Gastos',
                            data: dailyData.map(d => d.total),
                            backgroundColor: '#ef4444',
                            borderRadius: 4,
                          }]
                        }}
                        options={{
                          scales: {
                            x: {
                              display: true,
                              grid: { display: false },
                              ticks: { color: '#4b5563', font: { size: 8 } }
                            },
                            y: {
                              display: true,
                              grid: { color: 'rgba(255,255,255,0.05)' },
                              ticks: { color: '#4b5563', font: { size: 8 } }
                            }
                          },
                          plugins: { legend: { display: false } }
                        }}
                      />
                    );
                  })()}
                </div>
              </div>
            ) : null}
          </div>
        ) : activeTab === 'ahorros' ? (
          <div className="space-y-6">
            {/* Premium Savings KPIs */}
            {(() => {
              const { totalInvested, totalInterest, accumulated } = calculateCompoundInterest();
              return (
                <div className="bg-dark-card rounded-3xl p-6 border border-dark-border shadow-2xl space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Patrimonio Total</p>
                      <h2 className="text-3xl font-black text-white">{formatCurrency(accumulated)}</h2>
                    </div>
                    <div className="bg-primary/10 p-3 rounded-2xl">
                      <PiggyBank className="w-6 h-6 text-primary" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dark-border">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Invertido</p>
                      <p className="text-lg font-bold text-white">{formatCurrency(totalInvested)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-income uppercase mb-1">Rendimiento</p>
                      <p className="text-lg font-bold text-income tracking-tighter">
                        +{formatCurrency(totalInterest)}
                        <span className="text-[10px] ml-1">({totalInvested > 0 ? ((totalInterest / totalInvested) * 100).toFixed(1) : 0}%)</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Savings History List */}
            <div className="space-y-4 pb-20">
              <h3 className="font-bold text-white uppercase tracking-widest text-[10px] px-2">Mis Inversiones</h3>
              {savings.length === 0 ? (
                <div className="bg-dark-card/30 rounded-3xl p-10 text-center border-2 border-dashed border-dark-border">
                  <PiggyBank className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest leading-tight">Crea tu primer hábito<br />de ahorro</p>
                </div>
              ) : (
                calculateCompoundInterest().history.map((saving) => (
                  <div key={saving.id} className="bg-dark-card border border-dark-border rounded-3xl p-5 shadow-xl group active:scale-[0.98] transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-base font-black text-white mb-0.5">{saving.name}</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">{new Date(saving.date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-primary leading-none">{formatCurrency(saving.currentValue)}</p>
                        <p className="text-[10px] text-income font-bold uppercase mt-1 leading-none tracking-tighter">+{((saving.interestEarned / saving.amount) * 100).toFixed(1)}% Ganancia</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase border-t border-dark-border/50 pt-4">
                      <span>Base: {formatCurrency(saving.amount)}</span>
                      <button onClick={() => deleteSaving(saving.id)} className="text-gray-700 hover:text-expense transition flex items-center gap-1">
                        <Trash2 className="w-3 h-3" />
                        <span>Retirar</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : activeTab === 'recordatorios' ? (
          <div className="space-y-6">
            {/* Reminder Aggregated Stats */}
            {(() => {
              const filteredByDate = filterRemindersByDate();
              // const totalReminders = filteredByDate.length;
              const pendingReminders = filteredByDate.filter(r => r.status === 'pendiente');
              const totalPending = pendingReminders.reduce((sum, r) => sum + r.amount, 0);
              const overdue = pendingReminders.filter(r => getDaysUntilDue(r.dueDate) < 0).length;

              return (
                <div className="bg-dark-card rounded-3xl p-6 border border-dark-border shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                    <div className="space-y-1">
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Compromisos Mes</p>
                      <h2 className="text-3xl font-black text-white">{formatCurrency(totalPending)}</h2>
                    </div>
                    <div className="bg-primary/10 p-4 rounded-2xl">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-expense animate-pulse"></span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{overdue} Vencidos</span>
                    </div>
                    <div className="flex items-center gap-2 border-l border-dark-border pl-4">
                      <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">{pendingReminders.length - overdue} Próximos</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Reminders List */}
            <div className="space-y-4 pb-20">
              <h3 className="font-bold text-white uppercase tracking-widest text-[10px] px-2">Pendientes de Pago</h3>
              {filterRemindersByDate().length === 0 ? (
                <div className="bg-dark-card/30 rounded-3xl p-10 text-center border-2 border-dashed border-dark-border">
                  <p className="text-gray-500 text-xs font-bold uppercase">No hay pagos programados</p>
                </div>
              ) : (
                filterRemindersByDate().map((reminder) => {
                  const daysUntil = getDaysUntilDue(reminder.dueDate);
                  const isOverdue = daysUntil < 0;
                  return (
                    <div key={reminder.id} className={`bg-dark-card border rounded-3xl p-4 flex items-center justify-between group transition-all ${isOverdue ? 'border-expense/50 shadow-lg shadow-expense/5' : 'border-dark-border'
                      }`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${reminder.status === 'pagado' ? 'bg-income/10 text-income' : isOverdue ? 'bg-expense/10 text-expense' : 'bg-primary/10 text-primary'
                          }`}>
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-none mb-1">{reminder.name}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${isOverdue ? 'text-expense animate-pulse' : 'text-gray-500'}`}>
                            {reminder.status === 'pagado' ? 'Pagado' : isOverdue ? `Vencido hace ${Math.abs(daysUntil)} días` : `Vence en ${daysUntil} días`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-white leading-none">{formatCurrency(reminder.amount)}</p>
                        <button
                          onClick={() => toggleReminderStatus(reminder.id, reminder.status, reminder)}
                          className={`text-[8px] font-bold uppercase tracking-widest mt-2 px-3 py-1 rounded-full border transition-all ${reminder.status === 'pagado' ? 'bg-income/20 border-income/50 text-income' : 'border-dark-border text-gray-500 hover:text-white hover:border-white'
                            }`}
                        >
                          {reminder.status === 'pagado' ? 'Listo' : 'Marcar Pago'}
                        </button>
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="text-gray-700 hover:text-expense transition p-1.5 rounded-lg hover:bg-expense/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : activeTab === 'empresa' ? (
          (() => {
            // Calculate business metrics
            const filteredBusinessTransactions = businessTransactions.filter(t => {
              const tDate = new Date(t.date);
              if (businessDateFilter === 'dia') {
                return tDate.toDateString() === businessSelectedDate.toDateString();
              } else if (businessDateFilter === 'mes') {
                return tDate.getMonth() === businessSelectedDate.getMonth() &&
                  tDate.getFullYear() === businessSelectedDate.getFullYear();
              } else if (businessDateFilter === 'ano') {
                return tDate.getFullYear() === businessSelectedDate.getFullYear();
              }
              return true;
            });

            const totalBusinessIncome = filteredBusinessTransactions
              .filter(t => t.type === 'ingreso' && t.status === 'pagado')
              .reduce((sum, t) => sum + t.amount, 0);

            const totalBusinessExpense = filteredBusinessTransactions
              .filter(t => t.type === 'egreso' && t.status === 'pagado')
              .reduce((sum, t) => sum + t.amount, 0);

            const businessBalance = totalBusinessIncome - totalBusinessExpense;

            return (
              <div className="space-y-6">
                {/* Business KPIs */}
                <div className="bg-dark-card rounded-3xl p-6 border border-dark-border shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 transition-colors"></div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <div className="space-y-1">
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Negocio Actual</p>
                        <h2 className="text-3xl font-black text-white">{formatCurrency(businessBalance)}</h2>
                      </div>
                      <div className="bg-primary/20 p-4 rounded-2xl">
                        <Briefcase className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-dark/40 rounded-2xl p-4 border border-dark-border">
                        <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Ventas</p>
                        <p className="text-lg font-bold text-income">{formatCurrency(totalBusinessIncome)}</p>
                      </div>
                      <div className="bg-dark/40 rounded-2xl p-4 border border-dark-border">
                        <p className="text-gray-400 text-[10px] font-bold uppercase mb-1">Costos</p>
                        <p className="text-lg font-bold text-expense">{formatCurrency(totalBusinessExpense)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Business Timeline */}
                <div className="space-y-4 pb-20">
                  <h3 className="font-bold text-white uppercase tracking-widest text-[10px] px-2">Operaciones Comerciales</h3>
                  {filteredBusinessTransactions.length === 0 ? (
                    <div className="bg-dark-card/30 rounded-3xl p-10 text-center border-2 border-dashed border-dark-border">
                      <p className="text-gray-500 text-xs font-bold uppercase">Sin registros comerciales</p>
                    </div>
                  ) : (
                    filteredBusinessTransactions.map((t) => (
                      <div key={t.id} className={`bg-dark-card border rounded-3xl p-4 flex items-center justify-between group transition-all ${t.status === 'pendiente' ? 'border-yellow-500/30' : 'border-dark-border'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.type === 'ingreso' ? 'bg-income/10 text-income' : 'bg-expense/10 text-expense'}`}>
                            {t.type === 'ingreso' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white leading-none mb-1">{t.category}</p>
                            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{t.description || 'Venta general'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className={`text-[8px] uppercase font-black px-1.5 py-0.5 rounded ${t.status === 'pagado' ? 'bg-income/20 text-income' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                {t.status}
                              </p>
                              {t.client_name && <p className="text-[8px] text-gray-600 font-bold uppercase">{t.client_name}</p>}
                              {t.invoice_number && <p className="text-[8px] text-gray-700 font-medium italic">#{t.invoice_number}</p>}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-base font-black ${t.type === 'ingreso' ? 'text-income' : 'text-expense'}`}>
                            {t.type === 'ingreso' ? '+' : '-'}{formatCurrency(t.amount)}
                          </p>
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => toggleBusinessStatus(t.id, t.status)}
                              className={`p-1.5 rounded-lg transition-colors ${t.status === 'pendiente' ? 'text-yellow-500 hover:bg-yellow-500/10' : 'text-income hover:bg-income/10'}`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteBusinessTransaction(t.id, t)} className="p-1.5 text-gray-700 hover:text-expense hover:bg-expense/10 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })()
        ) : activeTab === 'categorias' ? (
          <div className="space-y-6">
            <div className="bg-dark-card rounded-3xl p-6 border border-dark-border shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 transition-colors"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Tags className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Centro de Categorías</h3>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Personaliza tu organización</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-2 overflow-x-auto no-scrollbar pb-2">
                    {Object.keys(dynamicCategories).map(type => (
                      <button
                        key={type}
                        onClick={() => { setCategoryEditType(type); setEditingCategory(null); }}
                        className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all px-2 whitespace-nowrap ${categoryEditType === type ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-dark/40 text-gray-500 border border-dark-border'}`}
                      >
                        {type === 'gasto' ? 'Gasto Per.' :
                          type === 'ingreso' ? 'Ingreso Per.' :
                            type === 'business_ingreso' ? 'Venta Neg.' :
                              type === 'business_egreso' ? 'Costo Neg.' : 'Avisos'}
                      </button>
                    ))}
                  </div>

                  {/* Add/Edit Input */}
                  <div className="bg-dark/50 rounded-2xl p-4 border border-dark-border">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block">
                      {editingCategory ? `Editando: ${editingCategory.name}` : 'Nueva Categoría'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingCategory ? editCategoryInputValue : newCategoryName}
                        onChange={(e) => editingCategory ? setEditCategoryInputValue(e.target.value) : setNewCategoryName(e.target.value)}
                        placeholder={editingCategory ? "Nuevo nombre..." : "Ej. Transporte, Ventas..."}
                        className="flex-1 bg-dark-card border border-dark-border rounded-xl py-3 px-4 text-sm font-bold focus:border-primary outline-none text-white transition-all"
                      />
                      {editingCategory ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => { editCategory(categoryEditType, editingCategory.name, editCategoryInputValue); setEditingCategory(null); setEditCategoryInputValue(''); }}
                            className="bg-income hover:bg-green-600 text-white p-3 rounded-xl transition-all shadow-lg shadow-income/20"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => { setEditingCategory(null); setEditCategoryInputValue(''); }}
                            className="bg-dark border border-dark-border text-gray-500 p-3 rounded-xl hover:text-white transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { addCategory(categoryEditType, newCategoryName); setNewCategoryName(''); }}
                          className="bg-primary hover:bg-blue-600 text-white p-3 rounded-xl transition-all shadow-lg shadow-primary/20"
                        >
                          <PlusCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category List */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar pb-10">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">Existentes ({dynamicCategories[categoryEditType].length})</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {dynamicCategories[categoryEditType].map(cat => (
                        <div key={cat} className="flex items-center justify-between bg-dark/40 border border-dark-border rounded-2xl px-4 py-3 group hover:border-primary/50 transition-all">
                          <span className="text-sm font-bold text-white">{cat}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingCategory({ type: categoryEditType, name: cat }); setEditCategoryInputValue(cat); }}
                              className="p-2 text-gray-500 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteCategory(categoryEditType, cat)}
                              className="p-2 text-gray-700 hover:text-expense transition-colors hover:bg-expense/10 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null
        }

        {showNotificationConfig && (
          <div className="fixed inset-0 z-[100] flex items-start justify-end p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNotificationConfig(false)} />
            <div className="relative w-full max-w-sm bg-dark-card border border-dark-border rounded-3xl p-6 shadow-2xl animate-in slide-in-from-top-10 duration-300 mt-12 mr-0 sm:mr-4">

              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                    <Bell className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Notificaciones</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Avisos de pagos</p>
                  </div>
                </div>
                <button onClick={() => setShowNotificationConfig(false)} className="p-2 text-gray-500 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Permission Status */}
                <div className="bg-dark/50 rounded-2xl p-4 border border-dark-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase">Estado</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${notificationsEnabled === 'granted' ? 'bg-income/20 text-income' : 'bg-expense/20 text-expense'
                      }`}>
                      {notificationsEnabled === 'granted' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {notificationsEnabled !== 'granted' && (
                    <button
                      onClick={requestNotificationPermission}
                      className="w-full mt-2 bg-primary hover:bg-blue-600 text-white py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      Activar Avisos
                    </button>
                  )}
                </div>

                {/* Upcoming Alerts Preview */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Próximos Vencimientos</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                    {reminders.filter(r => r.status === 'pendiente' && getDaysUntilDue(r.dueDate) <= 7).length === 0 ? (
                      <p className="text-center text-gray-600 text-xs py-4 italic">Todo al día</p>
                    ) : (
                      reminders
                        .filter(r => r.status === 'pendiente' && getDaysUntilDue(r.dueDate) <= 7)
                        .map(r => {
                          const days = getDaysUntilDue(r.dueDate);
                          return (
                            <div key={r.id} className="flex items-center justify-between p-3 bg-dark/30 rounded-xl border border-dark-border/30">
                              <div>
                                <p className="text-white text-xs font-bold">{r.name}</p>
                                <p className={`text-[9px] font-black uppercase ${days < 0 ? 'text-expense' : 'text-yellow-500'}`}>
                                  {days < 0 ? `Venció hace ${Math.abs(days)} días` : `Vence en ${days} días`}
                                </p>
                              </div>
                              <span className="text-white text-xs font-mono font-bold">{formatCurrency(r.amount)}</span>
                            </div>
                          )
                        })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
        }

        {/* Modern Contextual Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-dark-card/90 backdrop-blur-xl border-t border-dark-border z-50 px-6 pb-6 pt-3 flex justify-between items-center max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('finanzas')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'finanzas' ? 'text-primary scale-110' : 'text-gray-500'}`}
          >
            <Layout className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Panel</span>
          </button>
          <button
            onClick={() => setActiveTab('ahorros')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'ahorros' ? 'text-primary scale-110' : 'text-gray-500'}`}
          >
            <PiggyBank className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Ahorros</span>
          </button>

          {/* Floating Add Button */}
          <div className="relative -mt-12">
            <button
              onClick={() => setShowAddModal(!showAddModal)}
              className={`w-14 h-14 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${showAddModal ? 'bg-expense rotate-45' : 'bg-primary'
                }`}
            >
              <PlusCircle className="w-8 h-8 text-white" />
            </button>
          </div>

          <button
            onClick={() => setActiveTab('recordatorios')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'recordatorios' ? 'text-primary scale-110' : 'text-gray-500'}`}
          >
            <Clock className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Avisos</span>
          </button>
          <button
            onClick={() => setActiveTab('empresa')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'empresa' ? 'text-primary scale-110' : 'text-gray-500'}`}
          >
            <Briefcase className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Empresa</span>
          </button>
          <button
            onClick={() => setActiveTab('categorias')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'categorias' ? 'text-primary scale-110' : 'text-gray-500'}`}
          >
            <Tags className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Categorías</span>
          </button>
        </div>

        {/* Premium Add Modal with OCR */}
        {

          showAddModal && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-dark-card w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 border-t border-dark-border shadow-2xl animate-in slide-in-from-bottom-full duration-500 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-white">
                    {activeTab === 'finanzas' ? 'Nuevo Registro' :
                      activeTab === 'ahorros' ? 'Nueva Inversión' :
                        activeTab === 'recordatorios' ? 'Nuevo Recordatorio' : 'Operación Comercial'}
                  </h3>
                  <button onClick={() => setShowAddModal(false)} className="p-2 text-gray-500 hover:text-white"><PlusCircle className="w-6 h-6 rotate-45" /></button>
                </div>

                {/* FINANZAS FORM (Default) */}
                {activeTab === 'finanzas' && (
                  <>
                    {/* OCR Fast Action */}
                    <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 mb-6 flex items-center justify-between group active:scale-[0.98] transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Carga Inteligente</p>
                          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Foto de recibo o PDF</p>
                        </div>
                      </div>
                      <label className="cursor-pointer bg-primary/20 text-primary px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-primary transition-all hover:text-white">
                        Subir
                        <input type="file" multiple className="hidden" accept="image/*,application/pdf" onChange={handleOCRFile} />
                      </label>
                    </div>

                    {/* Uploaded Images Preview */}
                    {uploadedImages.length > 0 && (
                      <div className="mb-6 space-y-3">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Archivos Adjuntos</label>
                        <div className="grid grid-cols-2 gap-3">
                          {uploadedImages.map((img, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-video bg-dark/50 rounded-2xl overflow-hidden border border-dark-border">
                                {img.file.type.startsWith('image/') ? (
                                  <img src={img.preview} alt={`Receipt ${index + 1}`} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <FileText className="w-8 h-8 text-primary" />
                                  </div>
                                )}
                              </div>
                              <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => removeImage(index)} className="flex-1 bg-expense/90 backdrop-blur-sm text-white px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-1 hover:bg-expense transition-all">
                                  <Trash2 className="w-3 h-3" /> Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      <div className="flex gap-4 p-1 bg-dark/50 rounded-2xl border border-dark-border">
                        <button onClick={() => setTransactionType('gasto')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${transactionType === 'gasto' ? 'bg-expense text-white shadow-lg' : 'text-gray-500'}`}>Gasto</button>
                        <button onClick={() => setTransactionType('ingreso')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${transactionType === 'ingreso' ? 'bg-income text-white shadow-lg' : 'text-gray-500'}`}>Ingreso</button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Monto Total</label>
                          <div className="relative group">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary group-focus-within:scale-110 transition-transform" />
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 pl-12 pr-4 text-xl font-mono font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Categoría</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none appearance-none cursor-pointer">
                              <option value="">Seleccionar</option>
                              {dynamicCategories[transactionType].map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Estado</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none appearance-none cursor-pointer">
                              <option value="pendiente">Pendiente</option>
                              <option value="pagado">Pagado</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Descripción</label>
                          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿En qué gastaste?" className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none transition-all placeholder:text-gray-700" />
                        </div>
                      </div>

                      <button onClick={() => { addTransaction(); setShowAddModal(false); }} disabled={isOCRProcessing} className="w-full bg-primary hover:bg-blue-600 disabled:bg-gray-700 text-white rounded-2xl py-5 font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 active:scale-95 transition-all mt-4">
                        {isOCRProcessing ? 'Procesando...' : 'Confirmar Registro'}
                      </button>
                    </div>
                  </>
                )}

                {/* AHORROS FORM */}
                {activeTab === 'ahorros' && (
                  <div className="space-y-6">
                    <div className="bg-dark/40 p-4 rounded-2xl border border-dark-border mb-4">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tasa de Rendimiento Anual (%)</label>
                      <div className="flex items-center gap-4 mt-2">
                        <input
                          type="text"
                          value={annualRate === 0 ? "" : (annualRate * 100).toString()}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              setAnnualRate(0);
                            } else {
                              const parsed = parseFloat(val);
                              if (!isNaN(parsed)) setAnnualRate(parsed / 100);
                            }
                          }}
                          className="w-24 bg-dark/50 border border-dark-border rounded-xl py-2 px-3 text-center font-bold text-income focus:border-income outline-none"
                        />
                        <p className="text-xs text-gray-500 leading-tight">Ajusta este valor según el rendimiento real de tus inversiones.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Monto a Invertir</label>
                        <div className="relative group">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary group-focus-within:scale-110 transition-transform" />
                          <input type="number" value={savingAmount} onChange={(e) => setSavingAmount(e.target.value)} placeholder="0.00" className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 pl-12 pr-4 text-xl font-mono font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Nombre de la Inversión</label>
                        <input type="text" value={savingName} onChange={(e) => setSavingName(e.target.value)} placeholder="Ej. Depósito a Plazo, Acciones..." className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none transition-all placeholder:text-gray-700" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Fecha de Inicio</label>
                        <input type="date" value={savingDate} onChange={(e) => setSavingDate(e.target.value)} className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none transition-all text-white" />
                      </div>
                    </div>

                    <button onClick={() => { addSaving(); setShowAddModal(false); }} className="w-full bg-primary hover:bg-blue-600 text-white rounded-2xl py-5 font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 active:scale-95 transition-all mt-4">
                      Guardar Inversión
                    </button>
                  </div>
                )}

                {/* RECORDATORIOS FORM */}
                {activeTab === 'recordatorios' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Monto a Pagar</label>
                        <div className="relative group">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary group-focus-within:scale-110 transition-transform" />
                          <input type="text" value={reminderAmount} onChange={(e) => handleReminderAmountInput(e.target.value)} placeholder="0.00" className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 pl-12 pr-4 text-xl font-mono font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Nombre del Servicio/Pago</label>
                        <input type="text" value={reminderName} onChange={(e) => setReminderName(e.target.value)} placeholder="Ej. Tarjeta de Crédito, Luz..." className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none transition-all placeholder:text-gray-700" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Categoría</label>
                          <select value={reminderCategory} onChange={(e) => setReminderCategory(e.target.value)} className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none appearance-none cursor-pointer">
                            <option value="">Seleccionar</option>
                            {dynamicCategories.reminder.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Frecuencia</label>
                          <select value={reminderFrequency} onChange={(e) => setReminderFrequency(e.target.value)} className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none appearance-none cursor-pointer">
                            <option value="unica">Única vez</option>
                            <option value="mensual">Mensual</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Fecha de Vencimiento</label>
                        <input type="date" value={reminderDueDate} onChange={(e) => setReminderDueDate(e.target.value)} className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none transition-all text-white" />
                      </div>
                    </div>

                    <button onClick={() => { addReminder(); setShowAddModal(false); }} className="w-full bg-primary hover:bg-blue-600 text-white rounded-2xl py-5 font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 active:scale-95 transition-all mt-4">
                      Crear Recordatorio
                    </button>
                  </div>
                )}

                {/* EMPRESA FORM */}
                {activeTab === 'empresa' && (
                  <div className="space-y-6">
                    <div className="flex gap-4 p-1 bg-dark/50 rounded-2xl border border-dark-border">
                      <button onClick={() => setBusinessType('ingreso')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${businessType === 'ingreso' ? 'bg-income text-white shadow-lg' : 'text-gray-500'}`}>Venta</button>
                      <button onClick={() => setBusinessType('egreso')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${businessType === 'egreso' ? 'bg-expense text-white shadow-lg' : 'text-gray-500'}`}>Gasto</button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Monto de la Operación</label>
                        <div className="relative group">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary group-focus-within:scale-110 transition-transform" />
                          <input type="text" value={businessAmount} onChange={(e) => handleBusinessAmountInput(e.target.value)} placeholder="0.00" className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 pl-12 pr-4 text-xl font-mono font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-700" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Categoría</label>
                          <select value={businessCategory} onChange={(e) => setBusinessCategory(e.target.value)} className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none appearance-none cursor-pointer">
                            <option value="">Seleccionar</option>
                            {dynamicCategories[businessType === 'ingreso' ? 'business_ingreso' : 'business_egreso'].map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Estado</label>
                          <select value={businessStatus} onChange={(e) => setBusinessStatus(e.target.value)} className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none appearance-none cursor-pointer">
                            <option value="pendiente">Pendiente</option>
                            <option value="pagado">Pagado</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Cliente / Proveedor</label>
                        <input type="text" value={businessClient} onChange={(e) => setBusinessClient(e.target.value)} placeholder="Nombre del cliente o proveedor" className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none transition-all placeholder:text-gray-700" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Número de Factura (Opcional)</label>
                        <input type="text" value={businessInvoice} onChange={(e) => setBusinessInvoice(e.target.value)} placeholder="#000000" className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none transition-all placeholder:text-gray-700" />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-2">Detalles</label>
                        <input type="text" value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} placeholder="Descripción de la operación" className="w-full bg-dark/50 border border-dark-border rounded-2xl py-4 px-4 text-sm font-bold focus:border-primary outline-none transition-all placeholder:text-gray-700" />
                      </div>
                    </div>

                    <button onClick={() => { addBusinessTransaction(); setShowAddModal(false); }} className="w-full bg-primary hover:bg-blue-600 text-white rounded-2xl py-5 font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/30 active:scale-95 transition-all mt-4">
                      Registrar Operación
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        }

        {/* OCR Processing Overlay */}
        {
          isOCRProcessing && (
            <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-dark/80 backdrop-blur-md animate-in fade-in duration-300">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-primary rounded-full animate-ping opacity-25"></div>
                <div className="absolute inset-2 border-4 border-primary rounded-full animate-pulse"></div>
                <Camera className="absolute inset-0 m-auto w-10 h-10 text-primary animate-bounce" />
              </div>
              <p className="text-xl font-black text-white tracking-[0.3em] uppercase animate-pulse">Analizando Recibo</p>
              <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Extrayendo datos con IA...</p>
            </div>
          )
        }
      </div>
    </div>

  );
}
