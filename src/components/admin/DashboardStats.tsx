import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Package, Users, Activity, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DashboardData {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  pendingOrders: number;
  successfulOrders: number;
  todayRevenue: number;
  todayOrders: number;
  revenueGrowth: number;
}

export const DashboardStats = () => {
  const [data, setData] = useState<DashboardData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    pendingOrders: 0,
    successfulOrders: 0,
    todayRevenue: 0,
    todayOrders: 0,
    revenueGrowth: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Get orders data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('created_at, total, payment_status');

      if (ordersError) throw ordersError;

      // Get users count
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id');

      if (profilesError) throw profilesError;

      // Calculate stats
      const totalRevenue = orders
        ?.filter(order => order.payment_status === 'paid' || order.payment_status === 'success')
        .reduce((sum, order) => sum + order.total, 0) || 0;

      const totalOrders = orders?.length || 0;
      const totalUsers = profiles?.length || 0;
      
      const pendingOrders = orders?.filter(order => order.payment_status === 'pending').length || 0;
      const successfulOrders = orders?.filter(order => order.payment_status === 'paid' || order.payment_status === 'success').length || 0;

      // Today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = orders?.filter(order => 
        new Date(order.created_at) >= today
      ) || [];

      const todayRevenue = todayOrders
        .filter(order => order.payment_status === 'paid' || order.payment_status === 'success')
        .reduce((sum, order) => sum + order.total, 0);

      // Calculate growth (mock data for now)
      const revenueGrowth = 12.5; // This should be calculated based on previous period

      setData({
        totalRevenue,
        totalOrders,
        totalUsers,
        pendingOrders,
        successfulOrders,
        todayRevenue,
        todayOrders: todayOrders.length,
        revenueGrowth
      });

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data dashboard",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statsCards = [
    {
      title: "Total Revenue",
      value: `Rp ${data.totalRevenue.toLocaleString('id-ID')}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      description: "Total pendapatan keseluruhan",
      growth: `+${data.revenueGrowth}%`
    },
    {
      title: "Total Orders",
      value: data.totalOrders.toString(),
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      description: "Total pesanan keseluruhan",
      growth: null
    },
    {
      title: "Total Users",
      value: data.totalUsers.toString(),
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      description: "Pengguna terdaftar",
      growth: null
    },
    {
      title: "Pending Orders",
      value: data.pendingOrders.toString(),
      icon: Activity,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
      description: "Pesanan menunggu pembayaran",
      growth: null
    },
    {
      title: "Successful Orders",
      value: data.successfulOrders.toString(),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      description: "Pesanan berhasil",
      growth: null
    },
    {
      title: "Today's Revenue",
      value: `Rp ${data.todayRevenue.toLocaleString('id-ID')}`,
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
      description: "Pendapatan hari ini",
      growth: null
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <div className="flex-1">
                    <CardDescription className="text-sm font-medium">
                      {stat.title}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`text-2xl font-bold ${stat.color}`}>
                        {stat.value}
                      </div>
                      {stat.growth && (
                        <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-950 px-1.5 py-0.5 rounded">
                          {stat.growth}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quick Stats
            </CardTitle>
            <CardDescription>
              Statistik cepat sistem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="font-medium">
                  {data.totalOrders > 0 ? 
                    `${((data.successfulOrders / data.totalOrders) * 100).toFixed(1)}%` : 
                    '0%'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Avg. Order Value</span>
                <span className="font-medium">
                  {data.successfulOrders > 0 ? 
                    `Rp ${(data.totalRevenue / data.successfulOrders).toLocaleString('id-ID', { maximumFractionDigits: 0 })}` : 
                    'Rp 0'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Today's Orders</span>
                <span className="font-medium">{data.todayOrders}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance
            </CardTitle>
            <CardDescription>
              Performa sistem hari ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Revenue Today</span>
                <span className="font-medium text-green-600">
                  Rp {data.todayRevenue.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Orders Today</span>
                <span className="font-medium">{data.todayOrders}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Users</span>
                <span className="font-medium">{data.totalUsers}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};