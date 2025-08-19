import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Key, Download, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface License {
  id: string;
  kode_lisensi: string;
  aktif: boolean;
  created_at: string;
  updated_at: string;
  tutorial: string | null;
  link_download: string | null;
  product_id: string | null;
}

const Licenses = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkUserAndFetchLicenses();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchLicenses();
        } else {
          setLicenses([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUserAndFetchLicenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await fetchLicenses();
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const fetchLicenses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setLicenses(data || []);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data lisensi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (link: string, licenseName: string) => {
    if (link) {
      window.open(link, '_blank');
      toast({
        title: "Download Started",
        description: `Download untuk lisensi ${licenseName} telah dimulai.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Link download tidak tersedia.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Lisensi Saya
              </span>
            </h1>
            <Alert className="max-w-md mx-auto">
              <Key className="h-4 w-4" />
              <AlertDescription>
                Silakan login terlebih dahulu untuk melihat lisensi Anda.
              </AlertDescription>
            </Alert>
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Lisensi Saya
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Kelola dan akses semua lisensi produk ArfCoder Anda
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                      <div className="h-10 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : licenses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <Card className="max-w-lg mx-auto">
                <CardContent className="p-12">
                  <Key className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Belum Ada Lisensi</h3>
                  <p className="text-muted-foreground mb-6">
                    Anda belum memiliki lisensi produk. Silakan beli produk atau gunakan kode redeem untuk mendapatkan lisensi.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => window.location.href = '/products'}>
                      Lihat Produk
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = '/redeem'}>
                      Redeem Kode
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {licenses.map((license, index) => (
                <motion.div
                  key={license.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Key className="h-5 w-5" />
                          Lisensi #{license.id.slice(-8)}
                        </CardTitle>
                        <Badge variant={license.aktif ? "default" : "secondary"}>
                          {license.aktif ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {license.aktif ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </div>
                      <CardDescription>
                        Kode: {license.kode_lisensi || 'Belum digenerate'}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Dibuat: {formatDate(license.created_at)}
                        </div>
                        {license.updated_at !== license.created_at && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            Update: {formatDate(license.updated_at)}
                          </div>
                        )}
                      </div>

                      {license.tutorial && (
                        <div>
                          <h4 className="font-medium mb-2">Tutorial:</h4>
                          <p className="text-sm text-muted-foreground">
                            {license.tutorial}
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        {license.link_download && (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleDownload(license.link_download!, license.kode_lisensi || license.id)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                        
                        {license.kode_lisensi && (
                          <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => {
                              navigator.clipboard.writeText(license.kode_lisensi);
                              toast({
                                title: "Copied!",
                                description: "Kode lisensi telah disalin ke clipboard.",
                              });
                            }}
                          >
                            Copy Kode Lisensi
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Informasi Lisensi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  • Lisensi yang aktif dapat digunakan untuk mengakses produk dan fitur premium
                </p>
                <p>
                  • Setiap lisensi memiliki kode unik yang dapat digunakan untuk aktivasi
                </p>
                <p>
                  • Tutorial dan link download akan tersedia setelah pembelian atau redeem berhasil
                </p>
                <p>
                  • Hubungi admin jika ada masalah dengan lisensi Anda
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Licenses;