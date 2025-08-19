import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Order {
  id: string;
  created_at: string;
  total: number;
  status_bayar: string;
  payment_status: string;
  customer_name?: string;
  customer_email?: string;
  data_input?: any;
  processed_at?: string;
  supplier_status?: string;
  order_items?: any[];
}

const OrderStatus = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUserAndLoadOrders();

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

  const checkUserAndLoadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (!user) {
        navigate('/auth');
        return;
      }

      await loadOrders();
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total,
          status_bayar,
          payment_status,
          customer_name,
          customer_email,
          data_input,
          processed_at,
          supplier_status,
          order_items (
            id,
            quantity,
            unit_price,
            product_data
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "Gagal memuat riwayat pesanan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
      case 'success':
        return 'default';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      case 'pending':
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Dibayar';
      case 'success':
        return 'Berhasil';
      case 'failed':
        return 'Gagal';
      case 'cancelled':
        return 'Dibatalkan';
      case 'pending':
      default:
        return 'Menunggu';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p>Silakan login untuk melihat status pesanan</p>
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
              Status Pesanan
            </span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Lacak semua pesanan Anda di sini
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardContent className="text-center py-12">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Belum ada pesanan</h3>
                  <p className="text-muted-foreground mb-4">
                    Anda belum memiliki riwayat pesanan
                  </p>
                  <Button onClick={() => navigate('/products')}>
                    Mulai Belanja
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Order #{order.id.slice(0, 8)}
                          </CardTitle>
                          <CardDescription>
                            {new Date(order.created_at).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <Badge variant={getStatusBadgeVariant(order.payment_status)} className="mb-2">
                            {getStatusIcon(order.payment_status)}
                            <span className="ml-1">{getStatusText(order.payment_status)}</span>
                          </Badge>
                          <p className="font-bold text-lg">
                            Rp {order.total.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          {order.customer_name && (
                            <p className="text-sm"><strong>Nama:</strong> {order.customer_name}</p>
                          )}
                          {order.customer_email && (
                            <p className="text-sm"><strong>Email:</strong> {order.customer_email}</p>
                          )}
                          {order.supplier_status && (
                            <p className="text-sm"><strong>Status Supplier:</strong> {order.supplier_status}</p>
                          )}
                          {order.processed_at && (
                            <p className="text-sm"><strong>Diproses:</strong> {new Date(order.processed_at).toLocaleString('id-ID')}</p>
                          )}
                        </div>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Detail
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detail Pesanan #{order.id.slice(0, 8)}</DialogTitle>
                              <DialogDescription>
                                Informasi lengkap pesanan Anda
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Informasi Pesanan</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p><strong>ID Pesanan:</strong> {order.id}</p>
                                    <p><strong>Status Pembayaran:</strong> {getStatusText(order.payment_status)}</p>
                                    <p><strong>Total:</strong> Rp {order.total.toLocaleString('id-ID')}</p>
                                  </div>
                                  <div>
                                    <p><strong>Tanggal:</strong> {new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                                    {order.supplier_status && (
                                      <p><strong>Status Supplier:</strong> {order.supplier_status}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {order.data_input && (
                                <div>
                                  <h4 className="font-medium mb-2">Data Pembelian</h4>
                                  <div className="bg-muted p-3 rounded text-sm">
                                    <pre>{JSON.stringify(order.data_input, null, 2)}</pre>
                                  </div>
                                </div>
                              )}
                              
                              {order.order_items && order.order_items.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Item Pesanan</h4>
                                  <div className="space-y-2">
                                    {order.order_items.map((item, idx) => (
                                      <div key={idx} className="border p-3 rounded">
                                        <div className="flex justify-between">
                                          <span>{item.product_data?.nama_produk || 'Product'}</span>
                                          <span>Qty: {item.quantity}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          Rp {item.unit_price.toLocaleString('id-ID')} x {item.quantity} = Rp {(item.unit_price * item.quantity).toLocaleString('id-ID')}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default OrderStatus;