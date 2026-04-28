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
  Search, 
  MoreHorizontal,
  ChevronDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const INVOICES = [
  { id:"1", invoiceNumber:"INV-000123", clientName:"Transportadora Andrade Ltda", amount:"4500.00", dueDate:"2026-05-10", status:"pending"  },
  { id:"2", invoiceNumber:"INV-000124", clientName:"LogiBrasil S/A",            amount:"6200.00", dueDate:"2026-04-22", status:"overdue"  },
  { id:"3", invoiceNumber:"INV-000125", clientName:"Frota Sul Express",         amount:"3800.00", dueDate:"2026-04-30", status:"paid"     },
  { id:"4", invoiceNumber:"INV-000126", clientName:"Cargas Amazônia ME",        amount:"5100.00", dueDate:"2026-05-15", status:"paid"     },
  { id:"5", invoiceNumber:"INV-000127", clientName:"Transportes Bandeirantes",  amount:"2950.00", dueDate:"2026-05-05", status:"reissued" },
  { id:"6", invoiceNumber:"INV-000128", clientName:"NorteCargo Logística",      amount:"7200.00", dueDate:"2026-05-20", status:"pending"  },
];

const STATUS_CONFIG = {
  pending: { label: "Pendente", color: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  paid: { label: "Pago", color: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  overdue: { label: "Atrasado", color: "bg-rose-100 text-rose-800 border-rose-200", dot: "bg-rose-500" },
  reissued: { label: "2ª Via", color: "bg-indigo-100 text-indigo-800 border-indigo-200", dot: "bg-indigo-500" },
  cancelled: { label: "Cancelado", color: "bg-slate-100 text-slate-800 border-slate-200", dot: "bg-slate-500" },
};

function formatCurrency(value: string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
}

function formatDate(dateString: string) {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

export function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredInvoices = INVOICES.filter(inv => {
    const matchesSearch = inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-zinc-900 font-sans tracking-tight pb-20">
      <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tighter text-zinc-900">Faturas e Cobrança</h1>
            <p className="text-zinc-500 mt-1 text-sm md:text-base">Gerenciar faturas de locação e acompanhar pagamentos</p>
          </div>
          <Button className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-full px-6 h-11 shadow-sm transition-all w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Nova Fatura
          </Button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard title="Total de Faturas" value="8" icon={DollarSign} color="text-zinc-900" bgIcon="bg-zinc-100" />
          <StatCard title="Pendente" value="3" icon={Clock} color="text-amber-600" bgIcon="bg-amber-50" />
          <StatCard title="Pago" value="4" icon={CheckCircle} color="text-emerald-600" bgIcon="bg-emerald-50" />
          <StatCard title="Atrasado" value="1" icon={AlertCircle} color="text-rose-600" bgIcon="bg-rose-50" />
          <StatCard title="2ª Via" value="2" icon={RotateCcw} color="text-indigo-600" bgIcon="bg-indigo-50" className="col-span-2 md:col-span-1" />
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-[24px] shadow-sm border border-zinc-100 overflow-hidden">
          
          {/* Filters Bar */}
          <div className="p-4 md:p-6 border-b border-zinc-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/50">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input 
                placeholder="Buscar cliente ou fatura..." 
                className="pl-9 bg-zinc-50/50 border-zinc-200 focus-visible:ring-zinc-900 rounded-xl h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 bg-zinc-50/50 border-zinc-200 rounded-xl h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                  <SelectItem value="reissued">2ª Via</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-100 hover:bg-transparent">
                  <TableHead className="font-medium text-zinc-500 pl-6 h-12">Fatura #</TableHead>
                  <TableHead className="font-medium text-zinc-500 h-12">Cliente</TableHead>
                  <TableHead className="font-medium text-zinc-500 h-12">Valor</TableHead>
                  <TableHead className="font-medium text-zinc-500 h-12">Vencimento</TableHead>
                  <TableHead className="font-medium text-zinc-500 h-12">Status</TableHead>
                  <TableHead className="font-medium text-zinc-500 pr-6 text-right h-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <TableRow key={inv.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors group">
                      <TableCell className="font-medium text-zinc-900 pl-6 h-16">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-zinc-600">{inv.clientName}</TableCell>
                      <TableCell className="font-medium text-zinc-900">{formatCurrency(inv.amount)}</TableCell>
                      <TableCell className="text-zinc-600">{formatDate(inv.dueDate)}</TableCell>
                      <TableCell>
                        <StatusBadge status={inv.status as keyof typeof STATUS_CONFIG} />
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <ActionMenu status={inv.status} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                      Nenhuma fatura encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col divide-y divide-zinc-100">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((inv) => (
                <div key={inv.id} className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-zinc-900">{inv.clientName}</p>
                      <p className="text-sm text-zinc-500">{inv.invoiceNumber}</p>
                    </div>
                    <ActionMenu status={inv.status} />
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Valor</p>
                      <p className="font-medium text-zinc-900 text-lg">{formatCurrency(inv.amount)}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-1">Status</p>
                      <StatusBadge status={inv.status as keyof typeof STATUS_CONFIG} />
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-zinc-50 flex justify-between items-center text-sm">
                    <span className="text-zinc-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> Vencimento</span>
                    <span className="text-zinc-900 font-medium">{formatDate(inv.dueDate)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-zinc-500">
                Nenhuma fatura encontrada.
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgIcon: string;
  className?: string;
};

function StatCard({ title, value, icon: Icon, color, bgIcon, className = "" }: StatCardProps) {
  return (
    <Card className={`border-none shadow-sm rounded-[20px] bg-white overflow-hidden ${className}`}>
      <CardContent className="p-5 md:p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-4">
            <p className="text-sm font-medium text-zinc-500">{title}</p>
            <p className="text-3xl md:text-4xl font-semibold tracking-tighter text-zinc-900">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgIcon}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <Badge variant="outline" className={`font-medium border px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </Badge>
  );
}

function ActionMenu({ status }: { status: string }) {
  const showPaymentActions = status === "pending" || status === "overdue";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl border-zinc-100 shadow-lg">
        <DropdownMenuItem className="cursor-pointer text-zinc-700 focus:bg-zinc-50 focus:text-zinc-900 rounded-lg m-1">
          <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
        </DropdownMenuItem>
        
        {showPaymentActions && (
          <>
            <DropdownMenuItem className="cursor-pointer text-blue-600 focus:bg-blue-50 focus:text-blue-700 rounded-lg m-1">
              <Wallet className="mr-2 h-4 w-4" /> Pagar Fatura
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 rounded-lg m-1">
              <CheckCircle className="mr-2 h-4 w-4" /> Marcar como Pago
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-indigo-600 focus:bg-indigo-50 focus:text-indigo-700 rounded-lg m-1">
              <RotateCcw className="mr-2 h-4 w-4" /> Gerar 2ª Via
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator className="bg-zinc-100" />
        <DropdownMenuItem className="cursor-pointer text-rose-600 focus:bg-rose-50 focus:text-rose-700 rounded-lg m-1">
          <Trash2 className="mr-2 h-4 w-4" /> Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
