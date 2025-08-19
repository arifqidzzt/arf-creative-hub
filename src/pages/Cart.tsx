import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    nama_produk: string;
    harga: number;
    deskripsi: string;
    kategori: string;
  };
}

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
            id,
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

  const proceedToCheckout = () => {
    navigate('/checkout');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p>Silakan login untuk mengakses keranjang belanja</p>
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
              Keranjang Belanja
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Kelola produk yang ingin Anda beli
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Keranjang Anda ({cartItems.length} item)
                </CardTitle>
                <CardDescription>
                  Review produk sebelum checkout
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Keranjang Anda kosong</h3>
                    <p className="text-muted-foreground mb-4">
                      Mulai belanja untuk menambahkan produk ke keranjang
                    </p>
                    <Button onClick={() => navigate('/products')}>
                      Mulai Belanja
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium text-lg">{item.products.nama_produk}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{item.products.deskripsi}</p>
                            <p className="text-sm text-muted-foreground">Kategori: {item.products.kategori}</p>
                            <p className="font-bold text-primary text-lg mt-2">
                              Rp {item.products.harga.toLocaleString('id-ID')}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              
                              <span className="w-12 text-center font-medium">{item.quantity}</span>
                              
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="text-right">
                              <p className="font-bold">
                                Rp {(item.products.harga * item.quantity).toLocaleString('id-ID')}
                              </p>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => removeFromCart(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cart Summary */}
                    <div className="border-t pt-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-medium">Total Items:</span>
                        <span className="text-lg">{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-xl font-bold">Total Harga:</span>
                        <span className="text-xl font-bold text-primary">
                          Rp {calculateTotal().toLocaleString('id-ID')}
                        </span>
                      </div>
                      
                      <div className="flex gap-4">
                        <Button 
                          variant="outline" 
                          onClick={() => navigate('/products')}
                          className="flex-1"
                        >
                          Lanjut Belanja
                        </Button>
                        <Button 
                          onClick={proceedToCheckout}
                          className="flex-1"
                        >
                          Checkout
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Cart;