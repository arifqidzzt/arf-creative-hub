import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Smartphone, Gamepad2, Bot, Search, ShoppingCart, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('aktif', true)
        .order('kategori', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (product: any) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Anda harus login terlebih dahulu untuk membeli produk.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (product.stok <= 0) {
      toast({
        title: "Stok Habis",
        description: `Maaf, ${product.nama_produk} sedang tidak tersedia.`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Memproses Pembelian",
      description: `Sedang memproses pembelian ${product.nama_produk}...`,
    });

    try {
      const { data, error } = await supabase.functions.invoke('products', {
        body: { 
          product_id: product.id, 
          user_id: user.id 
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Pembelian Berhasil!",
        description: `${product.nama_produk} berhasil dibeli. Order ID: ${data.order_id}`,
      });

      // Refresh products to update stock
      fetchProducts();

      // Redirect to licenses after 2 seconds
      setTimeout(() => {
        navigate('/licenses');
      }, 2000);

    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan saat memproses pembelian.",
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = (product: any) => {
    toast({
      title: "Ditambahkan ke Keranjang",
      description: `${product.nama_produk} ditambahkan ke keranjang belanja.`,
    });
    // TODO: Implement cart functionality
    console.log('Added to cart:', product);
  };

  const categories = [
    {
      id: "pulsa",
      title: "Pulsa & Kuota", 
      icon: Smartphone,
      description: "Top-up pulsa dan paket data semua operator"
    },
    {
      id: "game",
      title: "Top-Up Game",
      icon: Gamepad2,
      description: "Diamond, UC, dan currency game populer"
    },
    {
      id: "bot",
      title: "Bot Premium",
      icon: Bot,
      description: "Bot automation dengan lisensi lengkap"
    }
  ];

  const filteredProducts = products.filter(product => 
    product.nama_produk.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.kategori.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getProductsByCategory = (categoryId) => {
    return filteredProducts.filter(product => product.kategori === categoryId);
  };

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
              Produk Kami
            </span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Temukan berbagai produk digital dengan harga terbaik
          </p>

          {/* User Status */}
          {user && (
            <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400">
                <User className="h-4 w-4" />
                <span className="text-sm">Login sebagai: {user.email}</span>
              </div>
            </div>
          )}
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </motion.div>

        {/* Categories */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Memuat produk...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {categories.map((category, categoryIndex) => {
              const categoryProducts = getProductsByCategory(category.id);
              
              if (categoryProducts.length === 0 && searchQuery) return null;
              
              return (
                <motion.section
                  key={category.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: categoryIndex * 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                      <category.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{category.title}</h2>
                      <p className="text-muted-foreground">{category.description}</p>
                    </div>
                  </div>

                  {categoryProducts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryProducts.map((product, productIndex) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (categoryIndex * 0.2) + (productIndex * 0.1) }}
                        >
                          <Card className="hover:shadow-lg transition-shadow duration-300 group">
                            <CardHeader>
                              <CardTitle className="text-lg">{product.nama_produk}</CardTitle>
                              <CardDescription>
                                {product.deskripsi}
                                {product.stok > 0 ? (
                                  <span className="block text-green-600 text-sm mt-1">Stok: {product.stok}</span>
                                ) : (
                                  <span className="block text-red-600 text-sm mt-1">Stok Habis</span>
                                )}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold text-primary mb-4">
                                Rp {product.harga.toLocaleString('id-ID')}
                              </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                              <Button 
                                className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                                disabled={product.stok === 0}
                                onClick={() => handlePurchase(product)}
                              >
                                🛒 {product.stok > 0 ? 'Beli Sekarang' : 'Stok Habis'}
                              </Button>
                              {product.stok > 0 && (
                                <Button 
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleAddToCart(product)}
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                </Button>
                              )}
                            </CardFooter>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    !searchQuery && (
                      <p className="text-center text-muted-foreground py-8">
                        Belum ada produk dalam kategori ini.
                      </p>
                    )
                  )}
                </motion.section>
              );
            })}
            
            {searchQuery && filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Tidak ada produk yang ditemukan untuk "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Products;