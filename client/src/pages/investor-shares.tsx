import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Truck, Search, TrendingUp, DollarSign, Wallet } from "lucide-react";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

interface ShareWithDetails {
  id: string;
  userId: string;
  trailerId: string;
  status: string;
  purchaseDate: string;
  purchaseValue: string;
  monthlyReturn: string;
  totalReturns: string;
  createdAt: Date;
  updatedAt: Date;
  userFirstName: string | null;
  userLastName: string | null;
  userEmail: string;
  trailerTrailerId: string;
  trailerPurchaseValue: string;
  trailerCurrentValue: string;
  trailerStatus: string;
  trailerLocation: string | null;
}

interface InvestorSummary {
  userId: string;
  investorName: string;
  email: string;
  activeShares: number;
  totalInvested: number;
  portfolioValue: number;
  totalReturns: number;
  profitability: number;
  shares: ShareWithDetails[];
}

export default function InvestorShares() {
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useTranslation();

  const { data: shares, isLoading } = useQuery<ShareWithDetails[]>({
    queryKey: ["/api/shares/all"],
  });

  const investorSummaries = useMemo(() => {
    if (!shares) return [];

    const groupedByUser = shares.reduce((acc, share) => {
      if (!acc[share.userId]) {
        acc[share.userId] = [];
      }
      acc[share.userId].push(share);
      return acc;
    }, {} as Record<string, ShareWithDetails[]>);

    return Object.entries(groupedByUser).map(([userId, userShares]) => {
      const firstShare = userShares[0];
      const activeShares = userShares.filter(s => s.status === "active").length;
      const totalInvested = userShares.reduce((sum, s) => sum + parseFloat(s.purchaseValue), 0);
      const portfolioValue = userShares.reduce((sum, s) => sum + parseFloat(s.trailerCurrentValue), 0);
      const totalReturns = userShares.reduce((sum, s) => sum + parseFloat(s.totalReturns), 0);
      const profitability = totalInvested > 0 ? ((portfolioValue - totalInvested + totalReturns) / totalInvested) * 100 : 0;

      return {
        userId,
        investorName: firstShare.userFirstName || firstShare.userLastName
          ? `${firstShare.userFirstName || ""} ${firstShare.userLastName || ""}`.trim()
          : "N/A",
        email: firstShare.userEmail,
        activeShares,
        totalInvested,
        portfolioValue,
        totalReturns,
        profitability,
        shares: userShares,
      };
    });
  }, [shares]);

  const filteredInvestors = investorSummaries.filter((investor) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      investor.investorName.toLowerCase().includes(searchLower) ||
      investor.email.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    totalShares: shares?.length || 0,
    activeShares: shares?.filter((s) => s.status === "active").length || 0,
    totalInvestors: investorSummaries.length,
    totalValue: shares?.reduce((sum, s) => sum + parseFloat(s.purchaseValue), 0) || 0,
    totalPortfolioValue: shares?.reduce((sum, s) => sum + parseFloat(s.trailerCurrentValue), 0) || 0,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8" data-testid="page-investor-shares">
      <div>
        <h1 className="text-3xl font-bold" data-testid="heading-investor-shares">{t('investorShares.title')}</h1>
        <p className="text-muted-foreground" data-testid="text-description">
          {t('investorShares.subtitle')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-shares">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('investorShares.totalShares')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-shares">{stats.totalShares}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-active-shares">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('investorShares.activeShares')}</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-shares">{stats.activeShares}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-investors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('investorShares.investors')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-investors">{stats.totalInvestors}</div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-invested">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('investorShares.totalInvested')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-invested">
              ${stats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            data-testid="input-search"
            placeholder={t('investorShares.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Investors Table */}
      <Card data-testid="card-investors-table">
        <CardHeader>
          <CardTitle>{t('investorShares.investorsList')}</CardTitle>
          <CardDescription>
            {filteredInvestors.length} {t('investorShares.investorsFound')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" data-testid={`skeleton-investor-${i}`} />
              ))}
            </div>
          ) : filteredInvestors && filteredInvestors.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 sm:px-4 font-medium whitespace-nowrap">{t('investorShares.investor')}</th>
                    <th className="text-left py-3 px-2 sm:px-4 font-medium whitespace-nowrap">{t('investorShares.email')}</th>
                    <th className="text-left py-3 px-2 sm:px-4 font-medium whitespace-nowrap">{t('investorShares.activeSharesCount')}</th>
                    <th className="text-left py-3 px-2 sm:px-4 font-medium whitespace-nowrap">{t('investorShares.totalInvested')}</th>
                    <th className="text-left py-3 px-2 sm:px-4 font-medium whitespace-nowrap">{t('investorShares.portfolioValue')}</th>
                    <th className="text-left py-3 px-2 sm:px-4 font-medium whitespace-nowrap">{t('investorShares.totalReturns')}</th>
                    <th className="text-left py-3 px-2 sm:px-4 font-medium whitespace-nowrap">{t('investorShares.profitability')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvestors.map((investor) => (
                    <tr key={investor.userId} className="border-b hover:bg-muted/50" data-testid={`row-investor-${investor.userId}`}>
                      <td className="py-3 px-2 sm:px-4" data-testid={`text-investor-${investor.userId}`}>
                        <div className="font-medium whitespace-nowrap">
                          {investor.investorName}
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-sm text-muted-foreground" data-testid={`text-email-${investor.userId}`}>
                        <div className="max-w-[150px] truncate" title={investor.email}>{investor.email}</div>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-center whitespace-nowrap" data-testid={`text-shares-${investor.userId}`}>
                        <Badge variant="outline">{investor.activeShares}</Badge>
                      </td>
                      <td className="py-3 px-2 sm:px-4 whitespace-nowrap" data-testid={`text-invested-${investor.userId}`}>
                        ${investor.totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 sm:px-4 font-semibold text-green-600 whitespace-nowrap" data-testid={`text-portfolio-${investor.userId}`}>
                        ${investor.portfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 sm:px-4 whitespace-nowrap" data-testid={`text-returns-${investor.userId}`}>
                        ${investor.totalReturns.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 sm:px-4 whitespace-nowrap" data-testid={`text-profitability-${investor.userId}`}>
                        <span className={investor.profitability >= 0 ? "text-green-600 font-semibold" : "text-red-600"}>
                          {investor.profitability >= 0 ? "+" : ""}{investor.profitability.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12" data-testid="text-no-investors">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? t('investorShares.noInvestorsFiltered') : t('investorShares.noInvestors')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
