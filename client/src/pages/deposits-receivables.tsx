import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { ArrowRight, Plus, Wallet, Receipt, Upload, Edit2, Trash2, CalendarDays, DollarSign } from "lucide-react";
import { Header } from "@/components/layout/header";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { insertDepositSchema, insertReceivableSchema, type Deposit, type Receivable, type Customer } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { format } from "date-fns";

export default function DepositsReceivables() {
  const [activeTab, setActiveTab] = useState("deposits");
  const [isAddDepositOpen, setIsAddDepositOpen] = useState(false);
  const [isAddReceivableOpen, setIsAddReceivableOpen] = useState(false);
  const [isEditDepositOpen, setIsEditDepositOpen] = useState(false);
  const [isEditReceivableOpen, setIsEditReceivableOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [editingDeposit, setEditingDeposit] = useState<any>(null);
  const [editingReceivable, setEditingReceivable] = useState<any>(null);
  const [payingReceivable, setPayingReceivable] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFullPayment, setIsFullPayment] = useState(true);

  const depositForm = useForm({
    resolver: zodResolver(insertDepositSchema),
    defaultValues: {
      customerId: "",
      amount: "",
      totalAmount: "",
      description: "",
      status: "active",
      isFullPayment: true,
    },
  });

  const receivableForm = useForm({
    resolver: zodResolver(insertReceivableSchema),
    defaultValues: {
      customerId: "",
      amount: "",
      dueDate: "",
      description: "",
      status: "pending",
      paidAmount: "0",
      notes: "",
    },
  });

  const { data: deposits = [], isLoading: depositsLoading } = useQuery<Deposit[]>({
    queryKey: ["/api/deposits"]
  });

  const { data: receivables = [], isLoading: receivablesLoading } = useQuery<Receivable[]>({
    queryKey: ["/api/receivables"]
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"]
  });

  // Deposit mutations
  const addDepositMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          formData.append(key, data[key]);
        }
      });
      
      if (selectedFile) {
        formData.append('receipt', selectedFile);
      }

      return await fetch("/api/deposits", {
        method: "POST",
        body: formData,
        credentials: "include",
      }).then(async res => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/receivables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsAddDepositOpen(false);
      depositForm.reset();
      setSelectedFile(null);
      setIsFullPayment(true);
      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الرعبون بنجاح",
      });
    },
    onError: (error: Error) => {
      let errorMessage = "فشل في تسجيل الرعبون";
      try {
        const errorText = error.message.split(': ')[1];
        if (errorText) {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        }
      } catch (e) {
        console.error("Error parsing error message:", error.message);
      }
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const editDepositMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          formData.append(key, data[key]);
        }
      });
      
      if (selectedFile) {
        formData.append('receipt', selectedFile);
      }

      return await fetch(`/api/deposits/${id}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      }).then(async res => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsEditDepositOpen(false);
      setEditingDeposit(null);
      depositForm.reset();
      setSelectedFile(null);
      toast({
        title: "تم بنجاح",
        description: "تم تعديل الرعبون بنجاح",
      });
    },
  });

  const deleteDepositMutation = useMutation({
    mutationFn: async (id: string) => {
      return await fetch(`/api/deposits/${id}`, {
        method: "DELETE",
        credentials: "include",
      }).then(async res => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف الرعبون بنجاح",
      });
    },
  });

  // Receivable mutations
  const addReceivableMutation = useMutation({
    mutationFn: async (data: any) => {
      return await fetch("/api/receivables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      }).then(async res => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receivables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setIsAddReceivableOpen(false);
      receivableForm.reset();
      toast({
        title: "تم بنجاح",
        description: "تم تسجيل المستحق بنجاح",
      });
    },
    onError: (error: Error) => {
      let errorMessage = "فشل في تسجيل المستحق";
      try {
        const errorText = error.message.split(': ')[1];
        if (errorText) {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        }
      } catch (e) {
        console.error("Error parsing error message:", error.message);
      }
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const editReceivableMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await fetch(`/api/receivables/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      }).then(async res => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receivables"] });
      setIsEditReceivableOpen(false);
      setEditingReceivable(null);
      receivableForm.reset();
      toast({
        title: "تم بنجاح",
        description: "تم تعديل المستحق بنجاح",
      });
    },
    onError: (error: Error) => {
      let errorMessage = "فشل في تعديل المستحق";
      try {
        const errorText = error.message.split(': ')[1];
        if (errorText) {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        }
      } catch (e) {
        console.error("Error parsing error message:", error.message);
      }
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteReceivableMutation = useMutation({
    mutationFn: async (id: string) => {
      return await fetch(`/api/receivables/${id}`, {
        method: "DELETE",
        credentials: "include",
      }).then(async res => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receivables"] });
      toast({
        title: "تم بنجاح",
        description: "تم حذف المستحق بنجاح",
      });
    },
  });

  const payReceivableMutation = useMutation({
    mutationFn: async ({ id, amount, file }: { id: string; amount: string; file: File | null }) => {
      const formData = new FormData();
      formData.append('amount', amount);
      if (file) {
        formData.append('receipt', file);
      }

      return await fetch(`/api/receivables/${id}/pay`, {
        method: "POST",
        body: formData,
        credentials: "include",
      }).then(async res => {
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receivables"] });
      queryClient.invalidateQueries({ queryKey: ["/api/income"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsPaymentDialogOpen(false);
      setPayingReceivable(null);
      setPaymentAmount("");
      setPaymentFile(null);
      toast({
        title: "تم بنجاح",
        description: "تم تسجيل الدفعة بنجاح",
      });
    },
    onError: (error: Error) => {
      let errorMessage = "فشل في تسجيل الدفعة";
      try {
        const errorText = error.message.split(': ')[1];
        if (errorText) {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        }
      } catch (e) {
        console.error("Error parsing error message:", error.message);
      }
      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const getCustomerName = (customerId: string) => {
    const customer = customers?.find((c: any) => c.id === customerId);
    return customer?.name || "غير معروف";
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: "bg-green-500/20 text-green-300",
      refunded: "bg-red-500/20 text-red-300",
      applied: "bg-blue-500/20 text-blue-300",
      pending: "bg-yellow-500/20 text-yellow-300",
      paid: "bg-green-500/20 text-green-300",
      overdue: "bg-red-500/20 text-red-300",
      cancelled: "bg-gray-500/20 text-gray-300",
    };

    const statusLabels = {
      active: "نشط",
      refunded: "مسترد",
      applied: "مطبق",
      pending: "معلق",
      paid: "مدفوع",
      overdue: "متأخر",
      cancelled: "ملغي",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusColors[status as keyof typeof statusColors] || statusColors.active}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" dir="rtl">
      <Header />
      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 sm:w-10 sm:h-10">
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </Link>
            <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              الرعبون والمستحقات
            </h1>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50">
            <TabsTrigger value="deposits" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 text-xs sm:text-base py-2 sm:py-3">
              <Wallet className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              الرعبون
            </TabsTrigger>
            <TabsTrigger value="receivables" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 text-xs sm:text-base py-2 sm:py-3">
              <Receipt className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              المستحقات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposits">
            <GlassCard className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
                <h2 className="text-lg sm:text-xl font-semibold">قائمة الرعبون</h2>
                <Dialog open={isAddDepositOpen} onOpenChange={setIsAddDepositOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500 w-full sm:w-auto text-sm sm:text-base">
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      إضافة رعبون
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800/95 border-gray-700">
                    <DialogHeader>
                      <DialogTitle>إضافة رعبون جديد</DialogTitle>
                    </DialogHeader>
                    <Form {...depositForm}>
                      <form onSubmit={depositForm.handleSubmit((data) => addDepositMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={depositForm.control}
                          name="customerId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>العميل</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="اختر العميل" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {customers?.map((customer: any) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                      {customer.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={depositForm.control}
                          name="isFullPayment"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={(e) => {
                                    field.onChange(e.target.checked);
                                    setIsFullPayment(e.target.checked);
                                  }}
                                  data-testid="checkbox-full-payment"
                                  className="w-4 h-4"
                                />
                              </FormControl>
                              <FormLabel className="!mt-0 cursor-pointer">المبلغ كامل</FormLabel>
                            </FormItem>
                          )}
                        />
                        {!isFullPayment && (
                          <FormField
                            control={depositForm.control}
                            name="totalAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>المبلغ الكامل (د.ع)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-total-amount" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <FormField
                          control={depositForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{isFullPayment ? 'المبلغ (د.ع)' : 'المبلغ المدفوع (د.ع)'}</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} data-testid="input-deposit-amount" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={depositForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الوصف</FormLabel>
                              <FormControl>
                                <Input placeholder="وصف الرعبون..." {...field} data-testid="input-deposit-description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={depositForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الحالة</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="active">نشط</SelectItem>
                                  <SelectItem value="applied">مطبق</SelectItem>
                                  <SelectItem value="refunded">مسترد</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div>
                          <Label>إيصال (اختياري)</Label>
                          <FileUpload
                            onFileSelect={setSelectedFile}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" className="flex-1">حفظ</Button>
                          <Button type="button" variant="outline" onClick={() => setIsAddDepositOpen(false)}>إلغاء</Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {depositsLoading ? (
                  <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
                ) : deposits && deposits.length > 0 ? (
                  deposits.map((deposit: any) => (
                    <div key={deposit.id} className="p-4 bg-gray-800/50 rounded-lg flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{getCustomerName(deposit.customerId)}</h3>
                          {getStatusBadge(deposit.status)}
                        </div>
                        <div className="text-gray-400 text-sm space-y-1">
                          <p>المبلغ: <span className="text-white font-semibold">{Number(deposit.amount).toLocaleString()} د.ع</span></p>
                          {deposit.description && <p>الوصف: {deposit.description}</p>}
                          <p>التاريخ: {format(new Date(deposit.createdAt), "yyyy-MM-dd")}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => deleteDepositMutation.mutate(deposit.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Wallet className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>لا توجد رعبون مسجلة بعد</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="receivables">
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">قائمة المستحقات</h2>
                <Dialog open={isAddReceivableOpen} onOpenChange={setIsAddReceivableOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة مستحق
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800/95 border-gray-700">
                    <DialogHeader>
                      <DialogTitle>إضافة مستحق جديد</DialogTitle>
                    </DialogHeader>
                    <Form {...receivableForm}>
                      <form onSubmit={receivableForm.handleSubmit((data) => addReceivableMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={receivableForm.control}
                          name="customerId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>العميل</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="اختر العميل" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {customers?.map((customer: any) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                      {customer.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={receivableForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>المبلغ الكلي (د.ع)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={receivableForm.control}
                          name="dueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>تاريخ الاستحقاق</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={receivableForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الوصف</FormLabel>
                              <FormControl>
                                <Input placeholder="وصف المستحق..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={receivableForm.control}
                          name="paidAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>المبلغ المدفوع (د.ع)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={receivableForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الحالة</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pending">معلق</SelectItem>
                                  <SelectItem value="paid">مدفوع</SelectItem>
                                  <SelectItem value="overdue">متأخر</SelectItem>
                                  <SelectItem value="cancelled">ملغي</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={receivableForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ملاحظات</FormLabel>
                              <FormControl>
                                <Input placeholder="ملاحظات إضافية..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2">
                          <Button type="submit" className="flex-1">حفظ</Button>
                          <Button type="button" variant="outline" onClick={() => setIsAddReceivableOpen(false)}>إلغاء</Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {receivablesLoading ? (
                  <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
                ) : receivables && receivables.length > 0 ? (
                  receivables.map((receivable: any) => (
                    <div key={receivable.id} className="p-4 bg-gray-800/50 rounded-lg flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{getCustomerName(receivable.customerId)}</h3>
                          {getStatusBadge(receivable.status)}
                        </div>
                        <div className="text-gray-400 text-sm space-y-1">
                          <p>المبلغ الكلي: <span className="text-white font-semibold">{Number(receivable.amount).toLocaleString()} د.ع</span></p>
                          <p>المبلغ المدفوع: <span className="text-green-400 font-semibold">{Number(receivable.paidAmount).toLocaleString()} د.ع</span></p>
                          <p>المتبقي: <span className="text-yellow-400 font-semibold">{(Number(receivable.amount) - Number(receivable.paidAmount)).toLocaleString()} د.ع</span></p>
                          <p>الوصف: {receivable.description}</p>
                          <p className="flex items-center gap-2">
                            <CalendarDays className="w-3 h-3" />
                            تاريخ الاستحقاق: {format(new Date(receivable.dueDate), "yyyy-MM-dd")}
                          </p>
                          {receivable.notes && <p>ملاحظات: {receivable.notes}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {receivable.status !== 'paid' && receivable.status !== 'cancelled' && (
                          <Button 
                            size="sm" 
                            variant="default" 
                            onClick={() => {
                              setPayingReceivable(receivable);
                              setPaymentAmount("");
                              setIsPaymentDialogOpen(true);
                            }}
                            data-testid={`button-pay-${receivable.id}`}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            تسديد
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => deleteReceivableMutation.mutate(receivable.id)} data-testid={`button-delete-${receivable.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Receipt className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>لا توجد مستحقات مسجلة بعد</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </TabsContent>
        </Tabs>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="bg-gray-800/95 border-gray-700">
            <DialogHeader>
              <DialogTitle>تسديد مستحق</DialogTitle>
            </DialogHeader>
            {payingReceivable && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-sm text-gray-400">العميل: <span className="text-white font-semibold">{getCustomerName(payingReceivable.customerId)}</span></p>
                  <p className="text-sm text-gray-400">المبلغ الكلي: <span className="text-white font-semibold">{Number(payingReceivable.amount).toLocaleString()} د.ع</span></p>
                  <p className="text-sm text-gray-400">المدفوع حالياً: <span className="text-green-400 font-semibold">{Number(payingReceivable.paidAmount).toLocaleString()} د.ع</span></p>
                  <p className="text-sm text-gray-400">المتبقي: <span className="text-yellow-400 font-semibold">{(Number(payingReceivable.amount) - Number(payingReceivable.paidAmount)).toLocaleString()} د.ع</span></p>
                </div>
                <div>
                  <Label>المبلغ المدفوع (د.ع)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    data-testid="input-payment-amount"
                  />
                </div>
                <div>
                  <Label>إيصال (اختياري)</Label>
                  <FileUpload onFileSelect={setPaymentFile} />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
                        toast({
                          title: "خطأ",
                          description: "الرجاء إدخال مبلغ صحيح",
                          variant: "destructive",
                        });
                        return;
                      }
                      payReceivableMutation.mutate({
                        id: payingReceivable.id,
                        amount: paymentAmount,
                        file: paymentFile
                      });
                    }}
                    disabled={payReceivableMutation.isPending}
                    className="flex-1"
                    data-testid="button-confirm-payment"
                  >
                    {payReceivableMutation.isPending ? "جاري التسديد..." : "تسديد"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsPaymentDialogOpen(false);
                      setPaymentAmount("");
                      setPaymentFile(null);
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
