# MongoDB Timeout no Vercel - Troubleshooting

## 🔧 Correções Aplicadas

### 1. **Configuração MongoDB Otimizada**
- `bufferCommands: false` - Crítico para Vercel
- Timeouts ajustados para serverless
- Pool de conexões reduzido (5 máximo)
- Removida opção `bufferMaxEntries` (não suportada)

### 2. **Sistema de Retry Automático**
- 3 tentativas automáticas para operações falhas
- Reconexão forçada em caso de erro
- Delay progressivo entre tentativas

### 3. **Health Check Avançado**
- Verificação ativa da conexão MongoDB
- Endpoint `/health` com status detalhado
- Monitoramento de memória e uptime

## 🚨 Erros Comuns e Soluções

### **MongoParseError: option buffermaxentries is not supported**
**Causa:** Opção `bufferMaxEntries` removida em versões recentes do driver
**Solução:** ✅ Opção removida das configurações

### **Error: Operation buffering timed out**
**Causa:** Mongoose tentando fazer buffer de comandos
**Solução:** ✅ Corrigido com `bufferCommands: false`

### **MongooseError: Operation timeout**
**Causa:** Timeouts muito baixos para Vercel
**Solução:** ✅ Timeouts ajustados (10-20s)

### **Connection pool closed**
**Causa:** Pool de conexões muito grande para serverless
**Solução:** ✅ Pool reduzido para 5 conexões

### **ServerSelectionTimeoutError**
**Causa:** Demora para encontrar servidor MongoDB
**Solução:** ✅ Timeout aumentado para 10s

## 🔍 Como Verificar se Está Funcionando

### 1. **Health Check**
```bash
curl https://your-app.vercel.app/health
```

Resposta esperada:
```json
{
  "status": "OK",
  "database": {
    "status": "healthy",
    "state": "connected"
  }
}
```

### 2. **Teste de Operação**
```bash
curl https://your-app.vercel.app/api/products
```

### 3. **Logs do Vercel**
- Procure por: "✅ Conectado ao MongoDB"
- Não deve ter: "buffering timed out"

## 📊 Configurações Recomendadas

### **MongoDB Atlas**
- **Tier:** M2 ou superior (M0 pode ter limitações)
- **Region:** Mesma região do Vercel (ex: us-east-1)
- **Network Access:** Permitir 0.0.0.0/0 (ou IPs do Vercel)
- **Database User:** Com permissões adequadas

### **Vercel Environment Variables**
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db?retryWrites=true&w=majority
NODE_ENV=production
FRONTEND_URLS=https://your-app.com
```

### **Connection String MongoDB**
Certifique-se que inclui:
- `retryWrites=true`
- `w=majority`
- `appName=YourApp`

## 🐛 Debugging

### **Verificar Logs**
1. Vá para Vercel Dashboard
2. Functions → View Function Logs
3. Procure por erros de MongoDB

### **Teste Local**
```bash
npm run dev
# Deve conectar sem erros
```

### **Variáveis de Ambiente**
Verifique se `MONGO_URI` está correta no Vercel Dashboard

## 🚀 Próximos Passos

1. **Deploy** com as novas configurações
2. **Teste** o endpoint `/health`
3. **Monitore** os logs por 24h
4. **Verifique** se timeouts diminuíram

## 📞 Se Problemas Persistirem

1. **Verifique MongoDB Atlas:**
   - Status do cluster
   - Métricas de conexão
   - Logs de acesso

2. **Verifique Vercel:**
   - Function timeout (60s)
   - Memory limit (1024MB)
   - Environment variables

3. **Considere:**
   - Upgrade do tier MongoDB
   - PlanetScale como alternativa
   - Supabase como alternativa
