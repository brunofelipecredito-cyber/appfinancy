import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Transaction } from "@/pages/Dashboard";

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
}

export function TransactionForm({ onSubmit, onCancel }: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Transaction['category']>('comissionamento');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category || !date) return;

    onSubmit({
      description,
      amount: parseFloat(amount.replace(',', '.')),
      type,
      category,
      date
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
      <div className="space-y-3">
        <Label className="text-gray-700 font-medium">Tipo de Lançamento</Label>
        <RadioGroup 
          defaultValue="income" 
          value={type}
          onValueChange={(val) => {
            const newType = val as 'income' | 'expense';
            setType(newType);
            setCategory(newType === 'income' ? 'comissionamento' : 'gastos');
          }}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2 bg-gray-50 border rounded-lg p-3 w-full cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-colors [&:has([data-state=checked])]:bg-emerald-50 [&:has([data-state=checked])]:border-emerald-500">
            <RadioGroupItem value="income" id="income" className="text-emerald-600" />
            <Label htmlFor="income" className="cursor-pointer font-medium text-emerald-900 w-full">Receita</Label>
          </div>
          <div className="flex items-center space-x-2 bg-gray-50 border rounded-lg p-3 w-full cursor-pointer hover:bg-red-50 hover:border-red-200 transition-colors [&:has([data-state=checked])]:bg-red-50 [&:has([data-state=checked])]:border-red-500">
            <RadioGroupItem value="expense" id="expense" className="text-red-600" />
            <Label htmlFor="expense" className="cursor-pointer font-medium text-red-900 w-full">Despesa</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-gray-700">Descrição</Label>
        <Input 
          id="description" 
          placeholder="Ex: Venda de Produto X" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="focus-visible:ring-emerald-500"
          data-testid="input-description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-gray-700">Valor (R$)</Label>
          <Input 
            id="amount" 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="focus-visible:ring-emerald-500"
            data-testid="input-amount"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="date" className="text-gray-700">Data</Label>
          <Input 
            id="date" 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="focus-visible:ring-emerald-500"
            data-testid="input-date"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="text-gray-700">Categoria</Label>
        <Select 
          value={category} 
          onValueChange={(val) => setCategory(val as Transaction['category'])}
          required
        >
          <SelectTrigger id="category" className="focus:ring-emerald-500" data-testid="select-category">
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {type === 'income' ? (
              <>
                <SelectItem value="comissionamento">Comissionamento</SelectItem>
                <SelectItem value="bonus">Bônus</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="descontos">Descontos Fixos</SelectItem>
                <SelectItem value="gastos">Gastos Variáveis</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="text-gray-600 hover:text-gray-900" data-testid="button-cancel-transaction">
          Cancelar
        </Button>
        <Button type="submit" className="bg-primary hover:bg-primary/90 text-white" data-testid="button-submit-transaction">
          Salvar Lançamento
        </Button>
      </div>
    </form>
  );
}