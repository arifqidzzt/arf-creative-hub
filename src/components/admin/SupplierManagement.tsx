import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Database, Plus, Edit, Trash2, DollarSign, Activity, Eye } from "lucide-react";
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
  DialogFooter,
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

interface SupplierConfig {
  id: string;
  name: string;
  api_url: string;
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TransactionLog {
  id: string;
  status: string;
  cost_amount: number;
  balance_before: number;
  balance_after: number;
  created_at: string;
  supplier_response: any;
}

export const SupplierManagement = () => {
  const [suppliers, setSuppliers] = useState<SupplierConfig[]>([]);
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierConfig | null>(null);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    api_url: '',
    api_key: '',
    balance: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSuppliers();
    loadTransactions();
  }, []);

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('supplier_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      console.error('Error loading suppliers:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data supplier",
        variant: "destructive",
      });
    }
  };

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transaction_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Error",
        description: "Gagal memuat log transaksi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addSupplier = async () => {
    if (!newSupplier.name || !newSupplier.api_url || !newSupplier.api_key) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      // In production, this should be encrypted
      const { data, error } = await supabase
        .from('supplier_configs')
        .insert([{
          name: newSupplier.name,
          api_url: newSupplier.api_url,
          api_key_encrypted: newSupplier.api_key, // Should be encrypted
          balance: newSupplier.balance,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      setSuppliers([data, ...suppliers]);
      setNewSupplier({ name: '', api_url: '', api_key: '', balance: 0 });
      setIsAddDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Supplier berhasil ditambahkan",
      });
    } catch (error: any) {
      console.error('Error adding supplier:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan supplier",
        variant: "destructive",
      });
    }
  };

  const toggleSupplierStatus = async (supplierId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('supplier_configs')
        .update({ is_active: !currentStatus })
        .eq('id', supplierId);

      if (error) throw error;

      setSuppliers(suppliers.map(s => 
        s.id === supplierId ? { ...s, is_active: !currentStatus } : s
      ));

      toast({
        title: "Success",
        description: `Supplier ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
      });
    } catch (error: any) {
      console.error('Error toggling supplier status:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status supplier",
        variant: "destructive",
      });
    }
  };

  const updateSupplierBalance = async (supplierId: string, newBalance: number) => {
    try {
      const { error } = await supabase
        .from('supplier_configs')
        .update({ balance: newBalance })
        .eq('id', supplierId);

      if (error) throw error;

      setSuppliers(suppliers.map(s => 
        s.id === supplierId ? { ...s, balance: newBalance } : s
      ));

      toast({
        title: "Success",
        description: "Saldo supplier berhasil diupdate",
      });
    } catch (error: any) {
      console.error('Error updating balance:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate saldo",
        variant: "destructive",
      });
    }
  };

  const getTotalBalance = () => {
    return suppliers.reduce((total, supplier) => total + supplier.balance, 0);
  };

  const getActiveSuppliers = () => {
    return suppliers.filter(s => s.is_active).length;
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{suppliers.length}</p>
                <p className="text-sm text-muted-foreground">Total Suppliers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{getActiveSuppliers()}</p>
                <p className="text-sm text-muted-foreground">Active Suppliers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">Rp {getTotalBalance().toLocaleString('id-ID')}</p>
                <p className="text-sm text-muted-foreground">Total Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Supplier Configuration
              </CardTitle>
              <CardDescription>
                Kelola konfigurasi dan saldo supplier API
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Supplier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Supplier Baru</DialogTitle>
                  <DialogDescription>
                    Masukkan detail konfigurasi supplier API
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nama Supplier</Label>
                    <Input
                      id="name"
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                      placeholder="Contoh: DigiFlazz API"
                    />
                  </div>
                  <div>
                    <Label htmlFor="api_url">API URL</Label>
                    <Input
                      id="api_url"
                      value={newSupplier.api_url}
                      onChange={(e) => setNewSupplier({...newSupplier, api_url: e.target.value})}
                      placeholder="https://api.supplier.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="api_key">API Key</Label>
                    <Input
                      id="api_key"
                      type="password"
                      value={newSupplier.api_key}
                      onChange={(e) => setNewSupplier({...newSupplier, api_key: e.target.value})}
                      placeholder="API Key dari supplier"
                    />
                  </div>
                  <div>
                    <Label htmlFor="balance">Saldo Awal</Label>
                    <Input
                      id="balance"
                      type="number"
                      value={newSupplier.balance}
                      onChange={(e) => setNewSupplier({...newSupplier, balance: Number(e.target.value)})}
                      placeholder="0"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addSupplier}>Add Supplier</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell className="font-mono text-xs">{supplier.api_url}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>Rp {supplier.balance.toLocaleString('id-ID')}</span>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Saldo</DialogTitle>
                            <DialogDescription>
                              Update saldo untuk {supplier.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="newBalance">Saldo Baru</Label>
                              <Input
                                id="newBalance"
                                type="number"
                                defaultValue={supplier.balance}
                                onBlur={(e) => {
                                  const newBalance = Number(e.target.value);
                                  if (newBalance !== supplier.balance) {
                                    updateSupplierBalance(supplier.id, newBalance);
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={supplier.is_active ? "default" : "secondary"}>
                      {supplier.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSupplierStatus(supplier.id, supplier.is_active)}
                      >
                        {supplier.is_active ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transaction Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Transaction Logs
          </CardTitle>
          <CardDescription>
            Log penggunaan saldo dan transaksi supplier
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4">Loading transaction logs...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Balance Before</TableHead>
                  <TableHead>Balance After</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Belum ada log transaksi
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'success' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>Rp {log.cost_amount?.toLocaleString('id-ID') || '0'}</TableCell>
                      <TableCell>Rp {log.balance_before?.toLocaleString('id-ID') || '0'}</TableCell>
                      <TableCell>Rp {log.balance_after?.toLocaleString('id-ID') || '0'}</TableCell>
                      <TableCell>
                        {log.supplier_response && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Supplier Response</DialogTitle>
                              </DialogHeader>
                              <div className="bg-muted p-4 rounded-lg">
                                <pre className="text-xs overflow-auto">
                                  {JSON.stringify(log.supplier_response, null, 2)}
                                </pre>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
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