import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { CheckCircle, Package, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      verifyPayment(sessionId);
    } else {
      setIsVerifying(false);
      toast({
        title: "Error",
        description: "Session ID tidak ditemukan",
        variant: "destructive",
      });
    }
  }, []);

  const verifyPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { session_id: sessionId }
      });

      if (error) {
        throw error;
      }

      setPaymentDetails(data);

      if (data.success) {
        // Clear cart after successful payment
        await clearCart();
        
        toast({
          title: "Pembayaran Berhasil!",
          description: "Terima kasih atas pembelian Anda",
        });
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast({
        title: "Error",
        description: "Gagal memverifikasi pembayaran",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const clearCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Memverifikasi pembayaran...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="text-center">
            <CardHeader className="pb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center"
              >
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </motion.div>
              
              <CardTitle className="text-3xl text-green-600 dark:text-green-400">
                Pembayaran Berhasil!
              </CardTitle>
              <CardDescription className="text-lg">
                Terima kasih atas pembelian Anda
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {paymentDetails && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-muted p-4 rounded-lg"
                >
                  <h3 className="font-semibold mb-2">Detail Pembayaran</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="text-green-600 font-medium">
                        {paymentDetails.payment_status === 'paid' ? 'Lunas' : paymentDetails.payment_status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span className="font-medium">
                        {paymentDetails.currency?.toUpperCase()} {(paymentDetails.amount_total || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-4"
              >
                <h3 className="font-semibold">Langkah Selanjutnya:</h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Lisensi Otomatis</p>
                      <p className="text-sm text-muted-foreground">
                        Lisensi produk sudah otomatis dibuat dan tersedia di halaman Lisensi Anda
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Download className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Download & Tutorial</p>
                      <p className="text-sm text-muted-foreground">
                        Link download dan tutorial lengkap tersedia di halaman lisensi
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex gap-4 justify-center pt-4"
              >
                <Button
                  onClick={() => navigate('/licenses')}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  Lihat Lisensi
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/products')}
                >
                  Belanja Lagi
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                >
                  Kembali ke Home
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-xs text-muted-foreground pt-6 border-t"
              >
                <p>Email konfirmasi dan detail lisensi akan segera dikirim ke email Anda.</p>
                <p className="mt-1">Jika ada pertanyaan, silakan hubungi customer service kami.</p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PaymentSuccess;