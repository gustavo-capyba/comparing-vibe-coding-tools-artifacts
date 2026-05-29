import { useGetMe, useUpsertMe, UpsertUserBodyNationality } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { validateCPF, validateRG, validateUSDriverLicense } from "@/lib/documentValidation";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  nationality: z.enum([UpsertUserBodyNationality.BR, UpsertUserBodyNationality.US]),
  phone: z.string().min(5, "Valid phone number required"),
  vehicleLicensePlate: z.string().min(1, "License plate required for park entry"),
  documentType: z.string().min(1, "Document type required"),
  documentNumber: z.string().min(1, "Document number required"),
}).superRefine((data, ctx) => {
  if (data.nationality === UpsertUserBodyNationality.BR) {
    if (data.documentType === 'CPF' && !validateCPF(data.documentNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid CPF. Must be exactly 11 digits.",
        path: ["documentNumber"]
      });
    }
    if (data.documentType === 'RG' && !validateRG(data.documentNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid RG. Must be 7-9 alphanumeric characters.",
        path: ["documentNumber"]
      });
    }
  } else if (data.nationality === UpsertUserBodyNationality.US) {
    if (data.documentType === 'Driver License' && !validateUSDriverLicense(data.documentNumber)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid US Driver License. Must be 8-14 alphanumeric characters.",
        path: ["documentNumber"]
      });
    }
  }
});

export default function ProfileSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const upsertMe = useUpsertMe();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      nationality: UpsertUserBodyNationality.BR,
      phone: "",
      vehicleLicensePlate: "",
      documentType: "CPF",
      documentNumber: "",
    },
  });

  const nationality = form.watch("nationality");

  useEffect(() => {
    if (user && user.name && user.documentNumber) {
      setLocation("/dashboard");
    }
  }, [user, setLocation]);

  useEffect(() => {
    if (nationality === UpsertUserBodyNationality.BR) {
      form.setValue("documentType", "CPF");
    } else {
      form.setValue("documentType", "Driver License");
    }
  }, [nationality, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    upsertMe.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Profile saved successfully" });
        setLocation("/dashboard");
      },
      onError: (err) => {
        toast({ title: "Error saving profile", description: String(err), variant: "destructive" });
      }
    });
  };

  if (isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>We need some details before you can access the park tracker.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nationality</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-nationality">
                            <SelectValue placeholder="Select nationality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={UpsertUserBodyNationality.BR}>Brazil</SelectItem>
                          <SelectItem value={UpsertUserBodyNationality.US}>United States</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234 567 8900" {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={nationality === UpsertUserBodyNationality.US}>
                        <FormControl>
                          <SelectTrigger data-testid="select-doctype">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {nationality === UpsertUserBodyNationality.BR ? (
                            <>
                              <SelectItem value="CPF">CPF</SelectItem>
                              <SelectItem value="RG">RG</SelectItem>
                            </>
                          ) : (
                            <SelectItem value="Driver License">Driver License</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="documentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter document number" {...field} data-testid="input-docnumber" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="vehicleLicensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle License Plate</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-1234" {...field} data-testid="input-plate" />
                    </FormControl>
                    <FormDescription>Required for park security and tracking.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={upsertMe.isPending} data-testid="button-submit-profile">
                {upsertMe.isPending ? "Saving..." : "Complete Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
