import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt, Calendar, FileText } from "lucide-react";
import { useLocation } from "wouter";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface InvoiceCheckoutData {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  dueDate?: string;
  referenceMonth?: string;
}

const CheckoutForm = ({ invoiceData }: { invoiceData: InvoiceCheckoutData }) => {
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
        return_url: `${window.location.origin}/invoices`,
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
        description: "Your invoice payment has been processed!",
      });
      setTimeout(() => setLocation('/invoices'), 2000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Invoice Summary</h3>
          <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Invoice Number
            </p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{invoiceData.invoiceNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Amount Due</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${invoiceData.amount.toFixed(2)}
            </p>
          </div>
        </div>
        {invoiceData.dueDate && (
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Due Date
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {new Date(invoiceData.dueDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )}
        {invoiceData.referenceMonth && (
          <div className="mt-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Reference Month</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{invoiceData.referenceMonth}</p>
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
          `Pay Invoice - $${invoiceData.amount.toFixed(2)}`
        )}
      </Button>

      <p className="text-xs text-center text-gray-500 dark:text-gray-500">
        Secure payment powered by Stripe. Your payment will be confirmed immediately.
      </p>
    </form>
  );
};

export default function CheckoutInvoice() {
  const [clientSecret, setClientSecret] = useState("");
  const [invoiceData, setInvoiceData] = useState<InvoiceCheckoutData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invoiceId = params.get('invoiceId');

    if (!invoiceId) {
      setError('Missing invoice information');
      toast({
        title: "Invalid Request",
        description: "Invoice ID is required",
        variant: "destructive",
      });
      setTimeout(() => setLocation('/invoices'), 2000);
      return;
    }

    apiRequest("POST", "/api/stripe/create-invoice-payment", { 
      invoiceId 
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setInvoiceData({
            invoiceId,
            invoiceNumber: data.invoiceNumber,
            amount: data.amount,
            dueDate: params.get('dueDate') || undefined,
            referenceMonth: params.get('referenceMonth') || undefined,
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
            <Button onClick={() => setLocation('/invoices')} className="w-full" data-testid="button-back-invoices">
              Back to Invoices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret || !invoiceData) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Pay Invoice</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Complete your rental payment securely
          </p>
        </div>

        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm invoiceData={invoiceData} />
        </Elements>
      </div>
    </div>
  );
}
