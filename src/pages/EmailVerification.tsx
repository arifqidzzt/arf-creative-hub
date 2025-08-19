import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Mail, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const EmailVerification = () => {
  const [step, setStep] = useState<'send' | 'verify'>('send');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { toast } = useToast();

  const sendOTP = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Masukkan alamat email terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { 
          email: email,
          purpose: 'email_verification'
        }
      });

      if (error) {
        throw error;
      }

      setStep('verify');
      toast({
        title: "OTP Sent",
        description: "Kode OTP telah dikirim ke email Anda. Periksa inbox atau folder spam.",
      });

    } catch (error: any) {
      console.error('Send OTP error:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengirim kode OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otpCode.trim()) {
      toast({
        title: "OTP Required", 
        description: "Masukkan kode OTP terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          otp_code: otpCode,
          email: email,
          purpose: 'email_verification'
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setIsVerified(true);
        toast({
          title: "Email Verified!",
          description: "Email Anda telah berhasil diverifikasi",
        });
      } else {
        throw new Error(data.error || "Verifikasi gagal");
      }

    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Kode OTP tidak valid atau sudah kedaluwarsa",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('send');
    setEmail('');
    setOtpCode('');
    setIsVerified(false);
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto"
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
                
                <CardTitle className="text-2xl text-green-600 dark:text-green-400">
                  Email Terverifikasi!
                </CardTitle>
                <CardDescription>
                  Email {email} telah berhasil diverifikasi
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Akun Anda sekarang memiliki status terverifikasi dan dapat mengakses semua fitur premium.
                </p>
                
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => window.location.href = '/'}
                    className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  >
                    Kembali ke Home
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                  >
                    Verifikasi Email Lain
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Verifikasi Email
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Verifikasi email Anda untuk mengamankan akun
          </p>
        </motion.div>

        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  {step === 'send' ? (
                    <Mail className="h-8 w-8 text-primary-foreground" />
                  ) : (
                    <Shield className="h-8 w-8 text-primary-foreground" />
                  )}
                </div>
                <CardTitle>
                  {step === 'send' ? 'Kirim Kode Verifikasi' : 'Masukkan Kode OTP'}
                </CardTitle>
                <CardDescription>
                  {step === 'send' 
                    ? 'Masukkan email Anda untuk menerima kode verifikasi'
                    : `Kode OTP telah dikirim ke ${email}`
                  }
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {step === 'send' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="nama@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>

                    <Button 
                      onClick={sendOTP}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                      {isLoading ? 'Mengirim...' : 'Kirim Kode OTP'}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="otp">Kode OTP (6 digit)</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="text-center text-lg font-mono tracking-wider"
                        disabled={isLoading}
                        maxLength={6}
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Kode akan kedaluwarsa dalam 15 menit
                      </p>
                    </div>

                    <Button 
                      onClick={verifyOTP}
                      disabled={isLoading || otpCode.length !== 6}
                      className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                    >
                      {isLoading ? 'Memverifikasi...' : 'Verifikasi OTP'}
                    </Button>

                    <Button 
                      variant="outline"
                      onClick={() => setStep('send')}
                      disabled={isLoading}
                      className="w-full"
                    >
                      Kirim Ulang Kode
                    </Button>
                  </>
                )}

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Verifikasi email meningkatkan keamanan akun dan memberikan akses ke fitur premium.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EmailVerification;