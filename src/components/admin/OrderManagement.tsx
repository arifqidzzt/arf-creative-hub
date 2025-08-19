import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Eye, Filter, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  supplier_order_id?: string;
  user_id: string;
  profiles?: {
    nama: string;
  } | null;
  order_items?: any[];
}

export const OrderManagement = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, dateFrom, dateTo, searchTerm]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (
            nama
          ),
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            product_data
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data as any) || []);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data pesanan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_status === statusFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(order => 
        new Date(order.created_at) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(order => 
        new Date(order.created_at) <= new Date(dateTo + 'T23:59:59')
      );
    }

    // Search term filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.profiles?.nama?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          payment_status: newStatus,
          processed_at: newStatus === 'success' ? new Date().toISOString() : null
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, payment_status: newStatus, processed_at: newStatus === 'success' ? new Date().toISOString() : null }
          : order
      ));

      toast({
        title: "Success",
        description: "Status pesanan berhasil diupdate",
      });
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate status pesanan",
        variant: "destructive",
      });
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

  const exportOrders = () => {
    const csvContent = [
      ['ID', 'Date', 'Customer', 'Email', 'Total', 'Status', 'Supplier Status'].join(','),
      ...filteredOrders.map(order => [
        order.id,
        new Date(order.created_at).toLocaleDateString('id-ID'),
        order.customer_name || order.profiles?.nama || '',
        order.customer_email || '',
        order.total,
        order.payment_status,
        order.supplier_status || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTotalStats = () => {
    const totalRevenue = filteredOrders
      .filter(order => order.payment_status === 'paid' || order.payment_status === 'success')
      .reduce((sum, order) => sum + order.total, 0);
    
    const pendingOrders = filteredOrders.filter(order => order.payment_status === 'pending').length;
    const successOrders = filteredOrders.filter(order => order.payment_status === 'success' || order.payment_status === 'paid').length;
    const failedOrders = filteredOrders.filter(order => order.payment_status === 'failed').length;

    return { totalRevenue, pendingOrders, successOrders, failedOrders };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">Rp {stats.totalRevenue.toLocaleString('id-ID')}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.successOrders}</p>
              <p className="text-sm text-muted-foreground">Success Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingOrders}</p>
              <p className="text-sm text-muted-foreground">Pending Orders</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.failedOrders}</p>
              <p className="text-sm text-muted-foreground">Failed Orders</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={loadOrders}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportOrders}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Management ({filteredOrders.length} orders)
          </CardTitle>
          <CardDescription>
            Kelola dan monitor semua pesanan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8">Loading orders...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada pesanan ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">
                        #{order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(order.created_at).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name || order.profiles?.nama || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">{order.customer_email || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">Rp {order.total.toLocaleString('id-ID')}</span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.payment_status}
                          onValueChange={(value) => updateOrderStatus(order.id, value)}
                        >
                          <SelectTrigger className="w-24">
                            <Badge variant={getStatusBadgeVariant(order.payment_status)} className="border-0">
                              {getStatusText(order.payment_status)}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {order.supplier_status && (
                          <Badge variant="outline">{order.supplier_status}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Order Details #{order.id.slice(0, 8)}</DialogTitle>
                              <DialogDescription>
                                Complete order information and data
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Order Information</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><strong>ID:</strong> {order.id}</p>
                                    <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString('id-ID')}</p>
                                    <p><strong>Status:</strong> {getStatusText(order.payment_status)}</p>
                                    <p><strong>Total:</strong> Rp {order.total.toLocaleString('id-ID')}</p>
                                    {order.processed_at && (
                                      <p><strong>Processed:</strong> {new Date(order.processed_at).toLocaleString('id-ID')}</p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Customer Information</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><strong>Name:</strong> {order.customer_name || order.profiles?.nama || 'N/A'}</p>
                                    <p><strong>Email:</strong> {order.customer_email || 'N/A'}</p>
                                    <p><strong>User ID:</strong> {order.user_id}</p>
                                    {order.supplier_order_id && (
                                      <p><strong>Supplier Order ID:</strong> {order.supplier_order_id}</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {order.data_input && (
                                <div>
                                  <h4 className="font-medium mb-2">Purchase Data</h4>
                                  <div className="bg-muted p-3 rounded text-sm">
                                    <pre>{JSON.stringify(order.data_input, null, 2)}</pre>
                                  </div>
                                </div>
                              )}

                              {order.order_items && order.order_items.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">Order Items</h4>
                                  <div className="space-y-2">
                                    {order.order_items.map((item, idx) => (
                                      <div key={idx} className="border p-3 rounded text-sm">
                                        <div className="flex justify-between mb-2">
                                          <span className="font-medium">
                                            {item.product_data?.nama_produk || 'Product'}
                                          </span>
                                          <span>Qty: {item.quantity}</span>
                                        </div>
                                        <div className="text-muted-foreground">
                                          Rp {item.unit_price.toLocaleString('id-ID')} x {item.quantity} = Rp {item.total_price.toLocaleString('id-ID')}
                                        </div>
                                        {item.product_data && (
                                          <div className="mt-2 text-xs bg-muted p-2 rounded">
                                            <pre>{JSON.stringify(item.product_data, null, 2)}</pre>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};