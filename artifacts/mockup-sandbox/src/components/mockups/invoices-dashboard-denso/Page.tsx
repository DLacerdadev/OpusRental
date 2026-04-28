import React, { useState } from "react";
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  Wallet,
  RotateCcw,
  Trash2,
  Filter,
  MoreHorizontal,
  Search,
  ChevronDown
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const initialInvoices = [
  { id: "1", invoiceNumber: "INV-000123", clientName: "Transportadora Andrade Ltda", amount: "4500.00", dueDate: "2026-05-10", status: "pending" },
  { id: "2", invoiceNumber: "INV-000124", clientName: "LogiBrasil S/A", amount: "6200.00", dueDate: "2026-04-22", status: "overdue" },
  { id: "3", invoiceNumber: "INV-000125", clientName: "Frota Sul Express", amount: "3800.00", dueDate: "2026-04-30", status: "paid" },
  { id: "4", invoiceNumber: "INV-000126", clientName: "Cargas Amazônia ME", amount: "5100.00", dueDate: "2026-05-15", status: "paid" },
  { id: "5", invoiceNumber: "INV-000127", clientName: "Transportes Bandeirantes", amount: "2950.00", dueDate: "2026-05-05", status: "reissued" },
  { id: "6", invoiceNumber: "INV-000128", clientName: "NorteCargo Logística", amount: "7200.00", dueDate: "2026-05-20", status: "pending" },
];

const statusColors = {
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  overdue: "bg-red-500/10 text-red-500 border-red-500/20",
  paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  reissued: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  canceled: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

const statusLabels = {
  pending: "PENDENTE",
  overdue: "ATRASADO",
  paid: "PAGO",
  reissued: "2ª VIA",
  canceled: "CANCELADO",
};

const statusDots = {
  pending: "bg-amber-500",
  overdue: "bg-red-500",
  paid: "bg-emerald-500",
  reissued: "bg-purple-500",
  canceled: "bg-slate-500",
};

function formatCurrency(value: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(parseFloat(value));
}

function formatDate(dateString: string) {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function calculateAge(dueDate: string) {
  const due = new Date(dueDate);
  // Using a fixed "today" for consistent mock display
  const today = new Date("2026-05-01");
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return <span className="text-red-400 font-mono text-xs">{Math.abs(diffDays)}d atrás</span>;
  } else if (diffDays === 0) {
    return <span className="text-amber-400 font-mono text-xs">Hoje</span>;
  } else {
    return <span className="text-slate-400 font-mono text-xs">em {diffDays}d</span>;
  }
}

export function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredInvoices = initialInvoices.filter((inv) => {
    const matchesSearch = inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-300 font-['Inter'] selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0A0A0B]/80 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium text-slate-100 flex items-center gap-2">
            Faturas e Cobrança
            <span className="bg-white/[0.08] text-slate-300 text-[10px] px-1.5 py-0.5 rounded-sm font-mono leading-none">
              v2.1
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gerenciar faturas de locação e acompanhar pagamentos</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm h-8 rounded-md px-3 text-xs font-medium w-full sm:w-auto">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nova Fatura
        </Button>
      </header>

      <main className="p-4 sm:px-6 max-w-7xl mx-auto space-y-6 mt-4">
        
        {/* KPI Strip (Dense) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-white/[0.08] rounded-lg overflow-hidden border border-white/[0.08]">
          <div className="bg-[#0f1115] p-3 flex flex-col gap-1">
            <div className="flex items-center text-slate-500 text-xs font-medium">
              <DollarSign className="h-3.5 w-3.5 mr-1.5" /> Total Faturas
            </div>
            <div className="text-xl font-medium text-slate-100">8</div>
          </div>
          <div className="bg-[#0f1115] p-3 flex flex-col gap-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 blur-xl rounded-full" />
            <div className="flex items-center text-amber-500/80 text-xs font-medium">
              <Clock className="h-3.5 w-3.5 mr-1.5" /> Pendente
            </div>
            <div className="text-xl font-medium text-amber-400">3</div>
          </div>
          <div className="bg-[#0f1115] p-3 flex flex-col gap-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/10 blur-xl rounded-full" />
            <div className="flex items-center text-emerald-500/80 text-xs font-medium">
              <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Pago
            </div>
            <div className="text-xl font-medium text-emerald-400">4</div>
          </div>
          <div className="bg-[#0f1115] p-3 flex flex-col gap-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-8 h-8 bg-red-500/10 blur-xl rounded-full" />
            <div className="flex items-center text-red-500/80 text-xs font-medium">
              <AlertCircle className="h-3.5 w-3.5 mr-1.5" /> Atrasado
            </div>
            <div className="text-xl font-medium text-red-400">1</div>
          </div>
          <div className="bg-[#0f1115] p-3 flex flex-col gap-1 relative overflow-hidden col-span-2 sm:col-span-1">
            <div className="absolute top-0 right-0 w-8 h-8 bg-purple-500/10 blur-xl rounded-full" />
            <div className="flex items-center text-purple-500/80 text-xs font-medium">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> 2ª Via
            </div>
            <div className="text-xl font-medium text-purple-400">2</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1.5 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Buscar cliente ou fatura..." 
                className="h-8 pl-8 bg-white/[0.03] border-white/[0.1] text-xs text-slate-200 placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-md w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="h-8 w-px bg-white/[0.1] hidden sm:block mx-1"></div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-full sm:w-[160px] bg-white/[0.03] border-white/[0.1] text-xs text-slate-200 focus:ring-1 focus:ring-indigo-500 rounded-md">
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3 w-3 text-slate-500" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-[#1a1d24] border-white/[0.1] text-slate-200 text-xs">
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
                <SelectItem value="reissued">2ª Via</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-xs text-slate-500 w-full sm:w-auto text-right font-mono">
            {filteredInvoices.length} registro(s)
          </div>
        </div>

        {/* Data View */}
        <div className="border border-white/[0.08] rounded-lg bg-[#0f1115] overflow-hidden">
          {/* Desktop/Tablet Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#15181e] text-slate-400 text-xs uppercase tracking-wider font-medium border-b border-white/[0.08]">
                <tr>
                  <th className="px-4 py-2.5 w-10 text-center"><Checkbox aria-label="Select all" className="border-slate-600 rounded-sm data-[state=checked]:bg-indigo-500" /></th>
                  <th className="px-4 py-2.5">Fatura</th>
                  <th className="px-4 py-2.5">Cliente</th>
                  <th className="px-4 py-2.5 text-right">Valor</th>
                  <th className="px-4 py-2.5">Vencimento</th>
                  <th className="px-4 py-2.5">Idade</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/[0.02] group transition-colors">
                    <td className="px-4 py-1.5 text-center w-10">
                      <Checkbox aria-label={`Select ${inv.invoiceNumber}`} className="border-slate-600 rounded-sm data-[state=checked]:bg-indigo-500 opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity" />
                    </td>
                    <td className="px-4 py-1.5 font-mono text-xs text-slate-300">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-1.5 text-xs text-slate-200 font-medium truncate max-w-[200px]">
                      {inv.clientName}
                    </td>
                    <td className="px-4 py-1.5 text-right font-mono text-xs text-slate-200">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="px-4 py-1.5 font-mono text-xs text-slate-400">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="px-4 py-1.5">
                      {calculateAge(inv.dueDate)}
                    </td>
                    <td className="px-4 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${statusDots[inv.status as keyof typeof statusDots]}`} />
                        <span className="text-[10px] uppercase font-medium text-slate-400">
                          {statusLabels[inv.status as keyof typeof statusLabels]}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-1.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:text-slate-200 hover:bg-white/[0.1]">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-[#1a1d24] border-white/[0.1] text-slate-200">
                          <DropdownMenuItem className="text-xs focus:bg-white/[0.05] focus:text-slate-100 cursor-pointer">
                            <Eye className="mr-2 h-3.5 w-3.5" /> Ver Detalhes
                          </DropdownMenuItem>
                          
                          {(inv.status === "pending" || inv.status === "overdue") && (
                            <>
                              <DropdownMenuItem className="text-xs text-blue-400 focus:bg-blue-500/10 focus:text-blue-300 cursor-pointer">
                                <Wallet className="mr-2 h-3.5 w-3.5" /> Pagar via PIX/Cartão
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-xs text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-300 cursor-pointer">
                                <CheckCircle className="mr-2 h-3.5 w-3.5" /> Marcar como Pago
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-xs text-purple-400 focus:bg-purple-500/10 focus:text-purple-300 cursor-pointer">
                                <RotateCcw className="mr-2 h-3.5 w-3.5" /> Gerar 2ª Via
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          <DropdownMenuSeparator className="bg-white/[0.1]" />
                          <DropdownMenuItem className="text-xs text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer">
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir Fatura
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-white/[0.08]">
            {filteredInvoices.map((inv) => (
              <div key={inv.id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-mono text-slate-400 mb-0.5">{inv.invoiceNumber}</div>
                    <div className="text-sm font-medium text-slate-200">{inv.clientName}</div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 -mr-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-[#1a1d24] border-white/[0.1] text-slate-200">
                      <DropdownMenuItem className="text-xs focus:bg-white/[0.05] focus:text-slate-100 cursor-pointer">
                        <Eye className="mr-2 h-3.5 w-3.5" /> Ver Detalhes
                      </DropdownMenuItem>
                      {(inv.status === "pending" || inv.status === "overdue") && (
                        <>
                          <DropdownMenuItem className="text-xs text-blue-400 focus:bg-blue-500/10 focus:text-blue-300 cursor-pointer">
                            <Wallet className="mr-2 h-3.5 w-3.5" /> Pagar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-300 cursor-pointer">
                            <CheckCircle className="mr-2 h-3.5 w-3.5" /> Marcar Pago
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs text-purple-400 focus:bg-purple-500/10 focus:text-purple-300 cursor-pointer">
                            <RotateCcw className="mr-2 h-3.5 w-3.5" /> 2ª Via
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator className="bg-white/[0.1]" />
                      <DropdownMenuItem className="text-xs text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer">
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="flex items-center justify-between mt-1">
                  <div className="font-mono text-sm text-slate-200">
                    {formatCurrency(inv.amount)}
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.08]">
                    <div className={`w-1.5 h-1.5 rounded-full ${statusDots[inv.status as keyof typeof statusDots]}`} />
                    <span className="text-[10px] uppercase font-medium text-slate-300">
                      {statusLabels[inv.status as keyof typeof statusLabels]}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-[#15181e] rounded p-2 border border-white/[0.04]">
                  <div className="text-xs text-slate-400 font-mono">
                    Venc: {formatDate(inv.dueDate)}
                  </div>
                  <div>
                    {calculateAge(inv.dueDate)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredInvoices.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              Nenhuma fatura encontrada.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Simple Checkbox component to avoid dependency on @radix-ui/react-checkbox if not strictly needed or complex to import inline, using native or simple styling for the dark theme.
const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    type="checkbox"
    ref={ref}
    className={`appearance-none h-3.5 w-3.5 rounded-[3px] border border-slate-600 bg-transparent checked:bg-indigo-500 checked:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-[#0f1115] transition-all cursor-pointer relative before:content-[''] before:absolute before:inset-0 before:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%2220 6 9 17 4 12%22></polyline></svg>')] before:bg-no-repeat before:bg-center before:bg-[length:10px_10px] before:opacity-0 checked:before:opacity-100 ${className}`}
    {...props}
  />
))
Checkbox.displayName = "Checkbox"
