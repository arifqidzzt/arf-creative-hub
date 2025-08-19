import { Navigation } from "@/components/Navigation";
import { motion } from "framer-motion";
import { Gift, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

const Redeem = () => {
  const [redeemCode, setRedeemCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      setMessage({ type: 'error', text: 'Masukkan kode redeem terlebih dahulu' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    // Simulate API call
    setTimeout(() => {
      // Mock validation - replace with actual API call
      if (redeemCode.toUpperCase() === 'ARFCODER2024') {
        setMessage({ type: 'success', text: 'Kode berhasil ditukar! Akses Chat Bot telah diaktifkan.' });
        setRedeemCode("");
      } else {
        setMessage({ type: 'error', text: 'Kode tidak valid atau sudah digunakan' });
      }
      setIsLoading(false);
    }, 2000);
  };

  const features = [
    {
      icon: Lock,
      title: "Akses Chat Bot Premium",
      description: "Dapatkan akses penuh ke Chat Bot AI dengan fitur-fitur canggih"
    },
    {
      icon: Gift,
      title: "Konten Eksklusif",
      description: "Akses ke cerpen dan komik premium yang tidak tersedia untuk umum"
    },
    {
      icon: CheckCircle,
      title: "Priority Support",
      description: "Dukungan prioritas dan bantuan langsung dari tim kami"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Redeem Code
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Tukarkan kode unik Anda untuk mendapatkan akses fitur premium
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {/* Redeem Form */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Gift className="h-8 w-8 text-primary-foreground" />
                </div>
                <CardTitle>Masukkan Kode Redeem</CardTitle>
                <CardDescription>
                  Kode redeem bersifat unik dan hanya dapat digunakan sekali
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Masukkan kode redeem..."
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                    className="text-center text-lg font-mono tracking-wider"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Kode terdiri dari huruf dan angka (contoh: ARFCODER2024)
                  </p>
                </div>

                {message && (
                  <Alert className={message.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950'}>
                    {message.type === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <AlertDescription className={message.type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                      {message.text}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              
              <CardFooter>
                <Button 
                  onClick={handleRedeem}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                >
                  {isLoading ? 'Memproses...' : 'Tukar Kode'}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <h3 className="text-2xl font-bold text-center mb-8">
              Apa yang Anda Dapatkan?
            </h3>
            
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-start space-x-4 p-4 rounded-lg bg-card/50 backdrop-blur-sm border"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-12 text-center"
          >
            <div className="bg-muted/50 rounded-lg p-6">
              <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Belum Punya Kode?</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Kode redeem tersedia melalui event khusus, pembelian produk tertentu, 
                atau promosi dari ArfCoder. Ikuti media sosial kami untuk update terbaru!
              </p>
              <Button variant="outline">
                Hubungi Admin
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Redeem;