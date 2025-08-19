import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { ShoppingCart, CreditCard, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    nama_produk: string;
    harga: number;
    deskripsi: string;
    kategori: string;
  };
}

const Checkout = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUserAndLoadCart();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUserAndLoadCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (!user) {
        navigate('/auth');
        return;
      }

      await loadCart();
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const loadCart = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          products (
            nama_produk,
            harga,
            deskripsi,
            kategori
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCartItems(data || []);
    } catch (error: any) {
      console.error('Error loading cart:', error);
      toast({
        title: "Error",
        description: "Gagal memuat keranjang belanja",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;
      
      setCartItems(cartItems.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));

      toast({
        title: "Updated",
        description: "Kuantitas produk berhasil diupdate",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal mengupdate kuantitas",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      setCartItems(cartItems.filter(item => item.id !== itemId));

      toast({
        title: "Removed",
        description: "Produk berhasil dihapus dari keranjang",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal menghapus produk",
        variant: "destructive",
      });
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => 
      total + (item.products.harga * item.quantity), 0
    );
  };

  const processCheckout = async (paymentMethod: string = "BRIVA") => {
    if (cartItems.length === 0) {
      toast({
        title: "Keranjang Kosong",
        description: "Tambahkan produk ke keranjang terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const items = cartItems.map(item => ({
        id: item.product_id,
        name: item.products.nama_produk,
        description: item.products.deskripsi || "",
        price: item.products.harga,
        quantity: item.quantity,
      }));

      console.log("Creating Tripay payment with items:", items);

      // Call Supabase function to create Tripay payment
      const { data, error } = await supabase.functions.invoke('tripay-create-payment', {
        body: { 
          items,
          payment_method: paymentMethod // Tripay payment method (BRIVA, MANDIRI, BCA, etc.)
        }
      });

      if (error) {
        console.error("Payment error:", error);
        throw new Error(error.message || "Gagal membuat pembayaran");
      }

      if (!data?.success || !data?.payment_url) {
        throw new Error("URL pembayaran tidak ditemukan");
      }

      console.log("Tripay payment created, redirecting to:", data.payment_url);
      
      // Redirect to Tripay payment page
      window.location.href = data.payment_url;

    } catch (error: any) {
      console.error("Process checkout error:", error);
      toast({
        title: "Gagal Memproses Pembayaran", 
        description: error.message || "Terjadi kesalahan saat memproses pembayaran",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p>Silakan login untuk mengakses checkout</p>
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
              Checkout
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Review dan selesaikan pembelian Anda
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cart Items */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Keranjang Belanja ({cartItems.length})
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p>Keranjang Anda kosong</p>
                    <Button 
                      className="mt-4"
                      onClick={() => navigate('/products')}
                    >
                      Belanja Sekarang
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.products.nama_produk}</h4>
                          <p className="text-sm text-muted-foreground">{item.products.deskripsi}</p>
                          <p className="font-bold text-primary">
                            Rp {item.products.harga.toLocaleString('id-ID')}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <span className="w-8 text-center">{item.quantity}</span>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Order Summary & Payment */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Ringkasan Pesanan</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.products.nama_produk} x{item.quantity}</span>
                      <span>Rp {(item.products.harga * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-primary">
                      Rp {calculateTotal().toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Button */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pembayaran
                </CardTitle>
                <CardDescription>
                  Pilih metode pembayaran yang Anda inginkan
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Pilih Metode Pembayaran:
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => processCheckout("BRIVA")}
                      disabled={isProcessing || cartItems.length === 0}
                      variant="outline"
                      size="sm"
                    >
                      BRI VA
                    </Button>
                    
                    <Button 
                      onClick={() => processCheckout("MANDIRI")}
                      disabled={isProcessing || cartItems.length === 0}
                      variant="outline"
                      size="sm"
                    >
                      Mandiri
                    </Button>
                    
                    <Button 
                      onClick={() => processCheckout("BCAVA")}
                      disabled={isProcessing || cartItems.length === 0}
                      variant="outline"
                      size="sm"
                    >
                      BCA VA
                    </Button>
                    
                    <Button 
                      onClick={() => processCheckout("BNIVA")}
                      disabled={isProcessing || cartItems.length === 0}
                      variant="outline"
                      size="sm"
                    >
                      BNI VA
                    </Button>
                    
                    <Button 
                      onClick={() => processCheckout("ALFAMART")}
                      disabled={isProcessing || cartItems.length === 0}
                      variant="outline"
                      size="sm"
                    >
                      Alfamart
                    </Button>
                    
                    <Button 
                      onClick={() => processCheckout("INDOMARET")}
                      disabled={isProcessing || cartItems.length === 0}
                      variant="outline"
                      size="sm"
                    >
                      Indomaret
                    </Button>
                  </div>
                  
                  <Button 
                    onClick={() => processCheckout("QRIS")}
                    disabled={isProcessing || cartItems.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? "Memproses..." : `Bayar dengan QRIS - Rp ${calculateTotal().toLocaleString('id-ID')}`}
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Pembayaran diproses dengan aman melalui Tripay Indonesia
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

export default Checkout;