import { useState, useRef, useEffect, useMemo } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import { calculateNetSalary } from "@/lib/taxes";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Trash2,
  TrendingUp,
  Wallet,
  MessageCircle,
  Send,
  Bot,
  User,
  CheckCircle2,
  Smartphone,
  Calculator,
  Percent,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: 'comissionamento' | 'bonus' | 'descontos' | 'gastos' | 'fixo';
  date: string;
  monthId: string; // YYYY-MM format
};

type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  isSystem?: boolean;
};

const initialChat: ChatMessage[] = [
  {
    id: 'msg-1',
    text: 'Olá! Sou seu assistente financeiro. Me envie mensagens como "ganhei 500 de comissão hoje" ou "gastei 80 com internet" que eu anoto tudo para você!',
    sender: 'bot',
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
];

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedSession = sessionStorage.getItem('finance_session');
    return savedSession === 'active';
  });
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [authError, setAuthError] = useState("");
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finance_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('finance_messages');
    return saved ? JSON.parse(saved) : initialChat;
  });
  const [inputValue, setInputValue] = useState('');
  const [baseSalary, setBaseSalary] = useState(() => {
    const saved = localStorage.getItem('finance_base_salary');
    return saved ? Number(saved) : 0;
  });
  
  // Navigation state for months
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Authentication logic
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser.toLowerCase() === 'bruno' && loginPass === '717874') {
      setIsAuthenticated(true);
      setAuthError("");
      sessionStorage.setItem('finance_session', 'active');
    } else {
      setAuthError("Usuário ou senha incorretos");
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Persist data
  useEffect(() => {
    localStorage.setItem('finance_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finance_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('finance_base_salary', baseSalary.toString());
  }, [baseSalary]);

  const handleDelete = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm("Tem certeza que deseja apagar todos os lançamentos e mensagens?")) {
      setTransactions([]);
      setMessages(initialChat);
      setBaseSalary(0);
      localStorage.removeItem('finance_transactions');
      localStorage.removeItem('finance_messages');
      localStorage.removeItem('finance_base_salary');
    }
  };

  const parseMessage = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // Extract number
    const match = text.match(/(?:r\$|rs)?\s*(\d+(?:[.,]\d+)?)/i);
    if (!match) return null;
    
    const amountStr = match[1].replace(',', '.');
    const amount = parseFloat(amountStr);

    let category: Transaction['category'] = 'gastos';
    let type: Transaction['type'] = 'expense';

    if (lowerText.includes('comissã') || lowerText.includes('comissa') || lowerText.includes('venda')) {
      category = 'comissionamento';
      type = 'income';
    } else if (lowerText.includes('bônus') || lowerText.includes('bonus') || lowerText.includes('premio') || lowerText.includes('prêmio')) {
      category = 'bonus';
      type = 'income';
    } else if (lowerText.includes('desconto')) {
      category = 'descontos';
      type = 'expense';
    } else if (lowerText.includes('gastei') || lowerText.includes('gasto') || lowerText.includes('comprei') || lowerText.includes('paguei') || lowerText.includes('com')) {
      category = 'gastos';
      type = 'expense';
    } else if (lowerText.includes('ganhei') || lowerText.includes('recebi')) {
      category = 'comissionamento';
      type = 'income';
    }

    // Attempt to extract description
    let description = '';
    const descMatch = lowerText.match(/(?:com|de|em) ([a-zá-ú\s]+)(?:hoje|ontem|agora)?/i);
    
    if (descMatch && descMatch[1]) {
      description = descMatch[1].trim();
      description = description.charAt(0).toUpperCase() + description.slice(1);
    } else if (category === 'comissionamento') {
      description = 'Comissão';
    } else if (category === 'bonus') {
      description = 'Bônus';
    } else if (category === 'descontos') {
      description = 'Desconto';
    } else if (category === 'gastos') {
      description = 'Gasto Diverso';
    }

    // Always use the exact wording the user provided if they didn't specify "com" or "de"
    if (!descMatch && !lowerText.includes('comissão') && !lowerText.includes('bônus')) {
      // Try to capture the noun after the verb
      const directMatch = lowerText.match(/(?:gastei|comprei|paguei) ([a-zá-ú\s]+)(?:hoje|ontem|agora|\d)/i);
      if (directMatch && directMatch[1]) {
        description = directMatch[1].trim();
        description = description.charAt(0).toUpperCase() + description.slice(1);
      }
    }

    const now = new Date();
    const currentMonthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    return { 
      amount, 
      category, 
      type, 
      description, 
      date: now.toISOString().split('T')[0],
      monthId: currentMonthId
    };
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      text: inputValue,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Simulate bot thinking and processing
    setTimeout(() => {
      const parsedData = parseMessage(userMsg.text);
      
      let botResponseText = "";
      
      if (parsedData) {
        const newTransaction = {
          ...parsedData,
          id: Math.random().toString(36).substring(2, 9)
        };
        
        setTransactions(prev => [newTransaction, ...prev]);
        
        // Auto-switch to the current month if not already there
        if (currentMonth !== parsedData.monthId) {
          setCurrentMonth(parsedData.monthId);
        }
        
        const categoryNames = {
          comissionamento: 'Comissão',
          bonus: 'Bônus',
          descontos: 'Desconto',
          gastos: 'Gasto',
          fixo: 'Fixo'
        };
        
        botResponseText = `✅ Lançamento registrado com sucesso!\nValor: ${formatCurrency(parsedData.amount)}\nTipo: ${categoryNames[parsedData.category]}\nDescrição: ${parsedData.description}`;
      } else {
        botResponseText = "Desculpe, não consegui entender o valor ou a categoria. Tente algo como 'ganhei 500 de comissão' ou 'gastei 50 com almoço'.";
      }

      const botMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        isSystem: !!parsedData
      };

      setMessages(prev => [...prev, botMsg]);
    }, 600);
  };

  // Filter transactions by selected month
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Handle legacy transactions without monthId
      if (!t.monthId) {
        const dateObj = new Date(t.date);
        const legacyMonthId = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        return legacyMonthId === currentMonth;
      }
      return t.monthId === currentMonth;
    });
  }, [transactions, currentMonth]);

  // Month navigation helpers
  const changeMonth = (offset: number) => {
    const [yearStr, monthStr] = currentMonth.split('-');
    let date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
    date.setMonth(date.getMonth() + offset);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const getMonthName = (monthId: string) => {
    const [yearStr, monthStr] = monthId.split('-');
    const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, 1);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${yearStr}`;
  };

  // Calculate summaries for the selected month
  const totalVariableIncomes = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const totalGrossIncome = baseSalary + totalVariableIncomes;
    
  const totalExpenses = monthlyTransactions
    .filter(t => t.type === 'expense' && t.category === 'gastos')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalDiscounts = monthlyTransactions
    .filter(t => t.type === 'expense' && t.category === 'descontos')
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  // Taxes and Net calculation
  const taxCalculation = calculateNetSalary(totalGrossIncome, totalDiscounts);
  const finalBalance = taxCalculation.net - totalExpenses;

  const getCategoryBadge = (category: string) => {
    switch(category) {
      case 'comissionamento': return <Badge variant="default" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none whitespace-nowrap">Comissão</Badge>;
      case 'bonus': return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none whitespace-nowrap">Bônus</Badge>;
      case 'descontos': return <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-none whitespace-nowrap">Desconto</Badge>;
      case 'gastos': return <Badge variant="outline" className="bg-orange-100 text-orange-800 hover:bg-orange-200 border-none whitespace-nowrap">Gasto</Badge>;
      default: return <Badge className="whitespace-nowrap">{category}</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] bg-gray-50 flex flex-col items-center justify-center p-6 overflow-hidden">
        <Card className="w-full max-w-md shadow-xl border-none animate-in fade-in zoom-in duration-500">
          <CardHeader className="text-center space-y-2 pt-8 pb-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Lock className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">Acesso Restrito</CardTitle>
            <CardDescription>Insira suas credenciais para continuar</CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input 
                  id="username" 
                  type="text" 
                  placeholder="Seu usuário" 
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="h-12"
                  autoComplete="username"
                  required
                />
              </div>
              <div className="space-y-2 pb-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Sua senha" 
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="h-12"
                  autoComplete="current-password"
                  required
                />
              </div>
              
              {authError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                  {authError}
                </div>
              )}
              
              <Button type="submit" className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white mt-4">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-gray-50/50 flex flex-col md:p-6 lg:p-8">
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col gap-4 p-4 md:p-0">
        
        {/* Header Block */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
              Finanças Inteligentes
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="outline" className="bg-white text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={handleClearAll} data-testid="button-clear-all">
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar Todos os Dados
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-white" data-testid="button-simulator">
                  <Calculator className="mr-2 h-4 w-4" />
                  Salário Base
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Configurar Salário Base</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label>Salário Base Fixo (R$)</Label>
                    <Input 
                      type="number" 
                      value={baseSalary} 
                      onChange={(e) => setBaseSalary(Number(e.target.value))}
                      className="focus-visible:ring-emerald-500"
                    />
                    <p className="text-xs text-gray-500">Este valor será a base em todos os meses para os cálculos de INSS e IR.</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20 lg:pb-0">
          
          {/* Left Column: WhatsApp Simulator */}
          <div className="col-span-1 lg:col-span-5 xl:col-span-4 flex flex-col h-[50vh] min-h-[400px] lg:h-[calc(100vh-140px)] border border-gray-200 rounded-2xl overflow-hidden bg-[#e5ddd5] shadow-lg relative shrink-0">
            {/* WhatsApp Header */}
            <div className="bg-[#00a884] text-white p-3 sm:p-4 flex items-center justify-between shadow-md z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Bot className="h-6 w-6 text-[#00a884]" />
                </div>
                <div>
                  <h3 className="font-semibold leading-tight text-sm sm:text-base">Assistente Financeiro</h3>
                  <p className="text-[10px] sm:text-xs text-emerald-100">online</p>
                </div>
              </div>
              <Unlock className="h-4 w-4 text-emerald-200 opacity-50" />
            </div>

            {/* Chat Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-4 bg-[url('https://w0.peakpx.com/wallpaper/508/871/HD-wallpaper-whatsapp-background-theme-pattern-textures.jpg')] bg-cover bg-center"
              style={{ backgroundBlendMode: 'soft-light', backgroundColor: 'rgba(229, 221, 213, 0.9)' }}
            >
              <div className="flex justify-center mb-4">
                <span className="bg-[#e1f3fb] text-gray-600 text-[10px] sm:text-xs px-3 py-1 rounded-lg shadow-sm">
                  {new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>
              
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2 shadow-sm relative ${
                      msg.sender === 'user' 
                        ? 'bg-[#d9fdd3] rounded-tr-none' 
                        : 'bg-white rounded-tl-none'
                    }`}
                  >
                    {msg.isSystem ? (
                      <div className="flex items-start gap-2 whitespace-pre-line text-xs sm:text-sm text-gray-800 font-medium">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div>{msg.text}</div>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-800 whitespace-pre-line leading-relaxed">{msg.text}</p>
                    )}
                    <div className={`text-[9px] sm:text-[10px] mt-1 text-right text-gray-500`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="bg-[#f0f2f5] p-2 sm:p-3 shrink-0">
              <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-white rounded-full px-2 sm:px-4 py-1 sm:py-2 shadow-sm">
                <Input 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="ganhei 500 de comissão..." 
                  className="border-0 focus-visible:ring-0 px-2 h-9 sm:h-10 shadow-none text-sm sm:text-base bg-transparent min-w-0"
                />
                <Button 
                  type="submit" 
                  size="icon"
                  className={`rounded-full h-8 w-8 sm:h-10 sm:w-10 shrink-0 transition-colors ${
                    inputValue.trim() ? 'bg-[#00a884] hover:bg-[#008f6f] text-white' : 'bg-gray-200 text-gray-400'
                  }`}
                  disabled={!inputValue.trim()}
                >
                  <Send className="h-4 w-4 sm:h-5 sm:w-5 sm:ml-1" />
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column: Dashboard */}
          <div className="col-span-1 lg:col-span-7 xl:col-span-8 flex flex-col gap-4 sm:gap-6 min-w-0">
            
            {/* Month Navigator */}
            <div className="flex items-center justify-between bg-white rounded-xl p-2 shadow-sm border border-gray-100">
              <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} className="h-8 w-8 rounded-full">
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </Button>
              <h2 className="text-sm font-semibold text-gray-800 tracking-wide">
                {getMonthName(currentMonth)}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} className="h-8 w-8 rounded-full">
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </Button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              <Card className="border-none shadow-md bg-white">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 whitespace-nowrap">Renda Bruta</p>
                    <p className="text-lg sm:text-xl xl:text-2xl font-bold text-gray-900 truncate" title={formatCurrency(totalGrossIncome)}>{formatCurrency(totalGrossIncome)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 whitespace-nowrap">IR/INSS</p>
                    <p className="text-lg sm:text-xl xl:text-2xl font-bold text-red-600 truncate" title={`-${formatCurrency(taxCalculation.inss + taxCalculation.irrf + taxCalculation.discounts)}`}>
                      -{formatCurrency(taxCalculation.inss + taxCalculation.irrf + taxCalculation.discounts)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-emerald-600 text-white col-span-2 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                <CardContent className="p-4 sm:p-6 relative z-10">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-emerald-100 whitespace-nowrap">Líquido Estimado</p>
                      <p className="text-2xl sm:text-3xl font-bold truncate" data-testid="text-net-salary" title={formatCurrency(taxCalculation.net)}>{formatCurrency(taxCalculation.net)}</p>
                    </div>
                    <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-200/50 shrink-0 ml-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Detalhe das Receitas</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Salário Fixo:</span>
                      <span className="font-medium text-gray-900 truncate max-w-[120px] text-right">{formatCurrency(baseSalary)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Comissões/Bônus:</span>
                      <span className="font-medium text-emerald-600 truncate max-w-[120px] text-right">+{formatCurrency(totalVariableIncomes)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Gastos e Sobra</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Gastos:</span>
                      <span className="font-medium text-orange-600 truncate max-w-[120px] text-right">-{formatCurrency(totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-gray-900">Sobra Final:</span>
                      <span className={`truncate max-w-[120px] text-right ${finalBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {formatCurrency(finalBalance)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transactions List */}
            <Card className="border-none shadow-md bg-white flex-1 flex flex-col min-h-[300px] lg:min-h-0 min-w-0">
              <CardHeader className="p-4 pb-3 shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-base sm:text-lg">Lançamentos do Mês</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative min-h-0">
                <ScrollArea className="absolute inset-0 w-full h-full border-t border-gray-100">
                  {monthlyTransactions.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-sm text-gray-500 px-4 text-center">
                      Nenhum lançamento em {getMonthName(currentMonth)}. Envie uma mensagem!
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50 w-full">
                      {monthlyTransactions.map((transaction) => (
                        <div key={transaction.id} className="p-3 sm:p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between gap-3 min-w-0 w-full">
                          <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                              <span className="font-medium text-sm sm:text-base text-gray-900 truncate shrink-0 max-w-[150px] sm:max-w-xs">{transaction.description}</span>
                              {getCategoryBadge(transaction.category)}
                            </div>
                            <span className="text-xs text-gray-500">{formatDate(transaction.date)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                            <span className={`text-sm sm:text-base font-bold whitespace-nowrap ${transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                              onClick={() => handleDelete(transaction.id)}
                              data-testid={`button-delete-${transaction.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}