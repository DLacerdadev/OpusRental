import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface ShareCheckoutData {
  shareId: string;
  trailerId: string;
  trailerInfo?: string;
}

const CheckoutForm = ({ shareData }: { shareData: ShareCheckoutData }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/investor-shares`,
      },
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Your share purchase is being processed!",
      });
      setTimeout(() => setLocation('/investor-shares'), 2000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 p-6 rounded-lg border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Investment Summary</h3>
          <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Share Price</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">$28,000</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Monthly Return
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$560</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">2% per month</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Annual Return
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">$6,720</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">24% per year</p>
          </div>
        </div>
        {shareData.trailerInfo && (
          <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">Trailer</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{shareData.trailerInfo}</p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Payment Details</h3>
        <PaymentElement />
      </div>

      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full h-12 text-lg"
        data-testid="button-submit-payment"
      >
        {isProcessing ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            Processing...
          </div>
        ) : (
          `Purchase Share - $28,000`
        )}
      </Button>

      <p className="text-xs text-center text-gray-500 dark:text-gray-500">
        Secure payment powered by Stripe. Your investment will be confirmed immediately after successful payment.
      </p>
    </form>
  );
};

export default function CheckoutShare() {
  const [clientSecret, setClientSecret] = useState("");
  const [shareData, setShareData] = useState<ShareCheckoutData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  if (!stripePromise) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <CardTitle className="text-yellow-600 dark:text-yellow-400">Payment Processing Unavailable</CardTitle>
            </div>
            <CardDescription>
              Payment processing is currently being configured. Please contact support or try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/investor-shares')} className="w-full" data-testid="button-back-shares">
              Back to Shares
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('shareId');
    const investorUserId = params.get('investorUserId');

    if (!shareId || !investorUserId) {
      setError('Missing share or investor information');
      toast({
        title: "Invalid Request",
        description: "Share ID and Investor ID are required",
        variant: "destructive",
      });
      setTimeout(() => setLocation('/investor-shares'), 2000);
      return;
    }

    apiRequest("POST", "/api/stripe/create-share-payment", { 
      shareId, 
      investorUserId 
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setShareData({
            shareId,
            trailerId: params.get('trailerId') || '',
            trailerInfo: params.get('trailerInfo') || undefined,
          });
        } else {
          throw new Error(data.message || 'Failed to create payment intent');
        }
      })
      .catch((err) => {
        setError(err.message);
        toast({
          title: "Payment Error",
          description: err.message,
          variant: "destructive",
        });
      });
  }, [toast, setLocation]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Payment Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/investor-shares')} className="w-full" data-testid="button-back-shares">
              Back to Shares
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret || !shareData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          <p className="text-gray-600 dark:text-gray-400">Preparing payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Complete Your Investment</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Secure your share in a commercial trailer with guaranteed monthly returns
          </p>
        </div>

        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm shareData={shareData} />
        </Elements>
      </div>
    </div>
  );
}
