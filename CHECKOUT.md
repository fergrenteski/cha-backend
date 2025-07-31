# API de Checkout - Mercado Pago

## Funcionalidade de Finalização de Compra

A API agora possui uma rota para finalizar compras com integração ao Mercado Pago, que inclui:

### ✅ **Validações Implementadas:**

1. **Carrinho não vazio**: Verifica se há produtos no carrinho
2. **Participantes obrigatórios**: Deve ter pelo menos 1 participante
3. **Valor mínimo por participante**: R$ 100,00 por pessoa
4. **Cálculo automático**: Divide o valor total pelos participantes

### 🛒 **Rota de Checkout**

```http
POST /api/cart/checkout
```

**Headers:**
```
Authorization: Bearer <token>  // Para usuários logados
Content-Type: application/json
```

**Body (para convidados):**
```json
{
  "guestToken": "token-do-convidado"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "checkout_url": "https://checkout.mercadopago.com.br/...",
  "sandbox_checkout_url": "https://sandbox.mercadopago.com.br/...",
  "preference_id": "123456789-abc123",
  "total_value": "500.00",
  "participants_count": 3,
  "value_per_participant": "166.67",
  "participants": ["João", "Maria", "Pedro"],
  "items": [
    {
      "name": "Produto A",
      "quantity": 2,
      "price": 150.00,
      "total": "300.00"
    }
  ]
}
```

**Resposta de Erro (valor insuficiente):**
```json
{
  "msg": "Valor por participante deve ser de pelo menos R$ 100.00. Valor atual: R$ 75.50",
  "valuePerParticipant": "75.50",
  "minValueRequired": 100,
  "totalValue": "453.00",
  "participantsCount": 6
}
```

### 🔔 **Webhook para Notificações**

```http
POST /api/cart/webhook
```

Recebe notificações automáticas do Mercado Pago sobre mudanças no status dos pagamentos.

### ⚙️ **Configuração de Variáveis de Ambiente**

Adicione estas novas variáveis no Vercel:

```env
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_do_mercadopago
FRONTEND_URL=https://seu-frontend.vercel.app
BACKEND_URL=https://seu-backend.vercel.app
```

### 🔒 **Como Obter o Access Token do Mercado Pago**

1. Acesse [developers.mercadopago.com](https://developers.mercadopago.com/)
2. Faça login na sua conta
3. Vá em "Suas integrações" → "Criar aplicação"
4. Configure sua aplicação
5. Copie o **Access Token** da seção "Credenciais de produção"

**Para testes:** Use o Access Token de **sandbox/teste**

### 📋 **Fluxo de Uso**

1. **Adicionar produtos** ao carrinho
2. **Adicionar participantes** (pelo menos 1)
3. **Chamar checkout** - a API valida:
   - Carrinho não vazio ✓
   - Participantes cadastrados ✓
   - Valor mínimo de R$ 100 por participante ✓
4. **Receber link de pagamento** do Mercado Pago
5. **Redirecionar usuário** para o checkout
6. **Receber notificações** via webhook

### 🧮 **Exemplo de Cálculo**

```
Carrinho:
- Produto A: R$ 200 x 1 = R$ 200
- Produto B: R$ 150 x 2 = R$ 300
- Produto C: R$ 100 x 1 = R$ 100

Total: R$ 600
Participantes: 3 pessoas
Valor por participante: R$ 600 ÷ 3 = R$ 200

✅ R$ 200 > R$ 100 (mínimo) - Checkout aprovado
```

### 🔍 **Metadados Incluídos**

O sistema inclui metadados no pagamento para facilitar o rastreamento:

- ID do carrinho
- Lista de participantes  
- Quantidade de participantes
- Valor por participante

### 🎯 **URLs de Retorno**

O usuário será redirecionado após o pagamento para:

- **Sucesso**: `/checkout/success`
- **Erro**: `/checkout/failure`  
- **Pendente**: `/checkout/pending`

Configure essas rotas no seu frontend para tratar cada cenário.
