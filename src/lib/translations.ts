export type Locale = "cs" | "en";

const translations = {
  cs: {
    // General
    appName: "Účetní Praxe",
    loading: "Načítání...",
    save: "Uložit",
    cancel: "Zrušit",
    delete: "Smazat",
    create: "Vytvořit",
    submit: "Odeslat",
    back: "Zpět",
    actions: "Akce",
    yes: "Ano",
    no: "Ne",
    
    // Auth
    login: "Přihlásit se",
    register: "Registrovat se",
    logout: "Odhlásit se",
    email: "E-mail",
    password: "Heslo",
    confirmPassword: "Potvrzení hesla",
    role: "Role",
    student: "Student",
    teacher: "Učitel",
    loginTitle: "Přihlášení",
    registerTitle: "Registrace",
    noAccount: "Nemáte účet?",
    hasAccount: "Již máte účet?",
    invalidCredentials: "Neplatné přihlašovací údaje",
    emailExists: "E-mail je již registrován",
    passwordMismatch: "Hesla se neshodují",

    // Navigation
    dashboard: "Přehled",
    workspaces: "Pracovní prostory",
    exercises: "Cvičení",
    submissions: "Odevzdání",
    accounts: "Účty",

    // Workspaces
    createWorkspace: "Vytvořit pracovní prostor",
    workspaceName: "Název prostoru",
    noWorkspaces: "Nemáte žádné pracovní prostory",
    workspaceDetail: "Detail pracovního prostoru",

    // Accounts
    accountCode: "Kód účtu",
    accountName: "Název účtu",
    accountType: "Typ účtu",
    normalBalance: "Normální strana",
    addAccount: "Přidat účet",
    removeAccount: "Odebrat účet",
    noAccounts: "Žádné účty",
    chartOfAccounts: "Účtová osnova",
    
    // Account types
    asset: "Aktivum",
    liability: "Pasivum",
    equity: "Vlastní kapitál",
    revenue: "Výnos",
    expense: "Náklad",

    // T-Account
    tAccount: "T-účet",
    debit: "MD (Má dáti)",
    credit: "Dal",
    md: "MD",
    dal: "Dal",
    balance: "Zůstatek",
    totalMD: "Celkem MD",
    totalDal: "Celkem Dal",

    // Transactions
    createTransaction: "Vytvořit transakci",
    transactionDescription: "Popis transakce",
    transactions: "Transakce",
    noTransactions: "Žádné transakce",
    addEntry: "Přidat položku",
    selectAccount: "Vyberte účet",
    amount: "Částka",
    side: "Strana",
    description: "Popis",
    
    // Validation
    imbalanceError: "MD a Dal se musí rovnat",
    minEntriesError: "Transakce musí mít alespoň 2 položky",
    positiveAmountError: "Částka musí být kladná",
    requiredField: "Povinné pole",
    transactionCreated: "Transakce byla vytvořena",
    transactionImmutable: "Transakce nelze po vytvoření upravit",

    // Exercises
    createExercise: "Vytvořit cvičení",
    exerciseTitle: "Název cvičení",
    exerciseDescription: "Popis cvičení",
    difficulty: "Obtížnost",
    easy: "Snadné",
    medium: "Střední",
    hard: "Těžké",
    expectedTransactions: "Očekávané transakce",
    noExercises: "Žádná cvičení",
    startExercise: "Začít cvičení",

    // Submissions
    submitExercise: "Odevzdat cvičení",
    score: "Skóre",
    correct: "Správně",
    incorrect: "Nesprávně",
    feedback: "Zpětná vazba",
    noSubmissions: "Žádná odevzdání",
    viewResult: "Zobrazit výsledek",
    
    // Errors
    unauthorized: "Neautorizováno",
    notFound: "Nenalezeno",
    serverError: "Chyba serveru",
    forbidden: "Přístup odepřen",
  },

  en: {
    appName: "Accounting Practice",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    create: "Create",
    submit: "Submit",
    back: "Back",
    actions: "Actions",
    yes: "Yes",
    no: "No",

    login: "Log In",
    register: "Register",
    logout: "Log Out",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    role: "Role",
    student: "Student",
    teacher: "Teacher",
    loginTitle: "Login",
    registerTitle: "Registration",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    invalidCredentials: "Invalid credentials",
    emailExists: "Email is already registered",
    passwordMismatch: "Passwords do not match",

    dashboard: "Dashboard",
    workspaces: "Workspaces",
    exercises: "Exercises",
    submissions: "Submissions",
    accounts: "Accounts",

    createWorkspace: "Create Workspace",
    workspaceName: "Workspace Name",
    noWorkspaces: "You have no workspaces",
    workspaceDetail: "Workspace Detail",

    accountCode: "Account Code",
    accountName: "Account Name",
    accountType: "Account Type",
    normalBalance: "Normal Balance",
    addAccount: "Add Account",
    removeAccount: "Remove Account",
    noAccounts: "No Accounts",
    chartOfAccounts: "Chart of Accounts",

    asset: "Asset",
    liability: "Liability",
    equity: "Equity",
    revenue: "Revenue",
    expense: "Expense",

    tAccount: "T-Account",
    debit: "Debit (MD)",
    credit: "Credit (Dal)",
    md: "MD",
    dal: "Dal",
    balance: "Balance",
    totalMD: "Total MD",
    totalDal: "Total Dal",

    createTransaction: "Create Transaction",
    transactionDescription: "Transaction Description",
    transactions: "Transactions",
    noTransactions: "No Transactions",
    addEntry: "Add Entry",
    selectAccount: "Select Account",
    amount: "Amount",
    side: "Side",
    description: "Description",

    imbalanceError: "Debit and Credit must be equal",
    minEntriesError: "Transaction must have at least 2 entries",
    positiveAmountError: "Amount must be positive",
    requiredField: "Required field",
    transactionCreated: "Transaction created",
    transactionImmutable: "Transactions cannot be edited after creation",

    createExercise: "Create Exercise",
    exerciseTitle: "Exercise Title",
    exerciseDescription: "Exercise Description",
    difficulty: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    expectedTransactions: "Expected Transactions",
    noExercises: "No Exercises",
    startExercise: "Start Exercise",

    submitExercise: "Submit Exercise",
    score: "Score",
    correct: "Correct",
    incorrect: "Incorrect",
    feedback: "Feedback",
    noSubmissions: "No Submissions",
    viewResult: "View Result",

    unauthorized: "Unauthorized",
    notFound: "Not Found",
    serverError: "Server Error",
    forbidden: "Forbidden",
  },
} as const;

export type TranslationKey = keyof typeof translations.cs;

export function t(key: TranslationKey, locale: Locale = "cs"): string {
  return translations[locale][key] ?? key;
}

export function useTranslations(locale: Locale = "cs") {
  return (key: TranslationKey) => t(key, locale);
}
