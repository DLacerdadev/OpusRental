import React, { useState } from "react";
import { 
  DollarSign, Clock, CheckCircle, AlertCircle, Plus, 
  Eye, Wallet, RotateCcw, Trash2, Filter, MoreHorizontal, 
  Search, ChevronDown 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const invoicesMock = [
  { id:"1", invoiceNumber:"INV-000123", clientName:"Transportadora Andrade Ltda", amount:"4500.00", dueDate:"2026-05-10", status:"pending"  },
  { id:"2", invoiceNumber:"INV-000124", clientName:"LogiBrasil S/A",            amount:"6200.00", dueDate:"2026-04-22", status:"overdue"  },
  { id:"3", invoiceNumber:"INV-000125", clientName:"Frota Sul Express",         amount:"3800.00", dueDate:"2026-04-30", status:"paid"     },
  { id:"4", invoiceNumber:"INV-000126", clientName:"Cargas Amazônia ME",        amount:"5100.00", dueDate:"2026-05-15", status:"paid"     },
  { id:"5", invoiceNumber:"INV-000127", clientName:"Transportes Bandeirantes",  amount:"2950.00", dueDate:"2026-05-05", status:"reissued" },
  { id:"6", invoiceNumber:"INV-000128", clientName:"NorteCargo Logística",      amount:"7200.00", dueDate:"2026-05-20", status:"pending"  },
];

const formatCurrency = (value: string) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value));
};

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredInvoices = invoicesMock.filter(inv => {
    const matchesSearch = inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'paid':
        return <Badge className="bg-[#10B981] hover:bg-[#10B981]/90 text-white font-medium border-none rounded-sm px-2.5 py-0.5">PAGO</Badge>;
      case 'pending':
        return <Badge className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white font-medium border-none rounded-sm px-2.5 py-0.5">PENDENTE</Badge>;
      case 'overdue':
        return <Badge className="bg-[#EF4444] hover:bg-[#EF4444]/90 text-white font-medium border-none rounded-sm px-2.5 py-0.5">ATRASADO</Badge>;
      case 'reissued':
        return <Badge className="bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white font-medium border-none rounded-sm px-2.5 py-0.5">2ª VIA</Badge>;
      case 'cancelled':
        return <Badge className="bg-[#6B7280] hover:bg-[#6B7280]/90 text-white font-medium border-none rounded-sm px-2.5 py-0.5">CANCELADO</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const ActionMenu = ({ invoice }: { invoice: any }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 text-[#0E2A4D]">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4 text-slate-500" />
          <span>Ver Detalhes</span>
        </DropdownMenuItem>
        
        {(invoice.status === 'pending' || invoice.status === 'overdue') && (
          <>
            <DropdownMenuItem className="cursor-pointer">
              <Wallet className="mr-2 h-4 w-4 text-[#3B82F6]" />
              <span className="text-[#3B82F6]">Pagar Fatura</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <CheckCircle className="mr-2 h-4 w-4 text-[#10B981]" />
              <span className="text-[#10B981]">Marcar como Pago</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <RotateCcw className="mr-2 h-4 w-4 text-[#8B5CF6]" />
              <span className="text-[#8B5CF6]">Emitir 2ª Via</span>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer focus:bg-red-50 focus:text-red-600">
          <Trash2 className="mr-2 h-4 w-4 text-[#EF4444]" />
          <span className="text-[#EF4444]">Excluir Fatura</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-['Inter'] p-4 md:p-6 lg:p-8 flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0E2A4D] tracking-tight">Faturas e Cobrança</h1>
          <p className="text-sm text-slate-500 mt-1">Gerenciar faturas de locação e acompanhar pagamentos</p>
        </div>
        <Button className="bg-[#0E2A4D] hover:bg-[#0E2A4D]/90 text-white shadow-sm font-medium w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova Fatura
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white col-span-2 sm:col-span-1">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Total de Faturas</p>
              <h3 className="text-2xl font-bold text-[#0E2A4D]">8</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-slate-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Pendente</p>
              <h3 className="text-2xl font-bold text-[#F59E0B]">3</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-[#F59E0B]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Pago</p>
              <h3 className="text-2xl font-bold text-[#10B981]">4</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-[#10B981]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Atrasado</p>
              <h3 className="text-2xl font-bold text-[#EF4444]">1</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-[#EF4444]" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">2ª Via</p>
              <h3 className="text-2xl font-bold text-[#8B5CF6]">2</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-violet-50 flex items-center justify-center">
              <RotateCcw className="h-5 w-5 text-[#8B5CF6]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Card className="border-slate-200 shadow-sm rounded-xl bg-white overflow-hidden flex-1">
        
        {/* Toolbar */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-white">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por cliente ou fatura..." 
              className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-[#0E2A4D]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full md:w-48">
              <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-slate-50 border-slate-200 focus:ring-[#0E2A4D]">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os status</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="PAID">Pago</SelectItem>
                  <SelectItem value="OVERDUE">Atrasado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  <SelectItem value="REISSUED">2ª Via</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Desktop/Tablet Table View */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-slate-100 hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-4">Fatura #</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vencimento</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-[#0E2A4D]">{invoice.invoiceNumber}</TableCell>
                    <TableCell className="text-slate-700">{invoice.clientName}</TableCell>
                    <TableCell className="font-medium text-slate-900">{formatCurrency(invoice.amount)}</TableCell>
                    <TableCell className="text-slate-600">{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <ActionMenu invoice={invoice} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                    Nenhuma fatura encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden flex flex-col p-4 gap-4 bg-slate-50/50">
          {filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardContent className="p-0">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-[#0E2A4D]">{invoice.invoiceNumber}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 line-clamp-1">{invoice.clientName}</p>
                    </div>
                    <div>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50/30 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5">Vencimento</p>
                      <p className="text-sm text-slate-700 font-medium">{formatDate(invoice.dueDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-0.5">Valor</p>
                      <p className="text-sm text-slate-900 font-bold">{formatCurrency(invoice.amount)}</p>
                    </div>
                  </div>
                  <div className="px-4 py-3 border-t border-slate-100 flex justify-end gap-2 bg-white">
                    <Button variant="outline" size="sm" className="h-8 text-slate-600 border-slate-200 w-full justify-center">
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      Ver
                    </Button>
                    {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                      <Button size="sm" className="h-8 bg-[#0E2A4D] hover:bg-[#0E2A4D]/90 text-white w-full justify-center">
                        <Wallet className="mr-2 h-3.5 w-3.5" />
                        Pagar
                      </Button>
                    )}
                    <ActionMenu invoice={invoice} />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
              Nenhuma fatura encontrada.
            </div>
          )}
        </div>

      </Card>
    </div>
  );
}
