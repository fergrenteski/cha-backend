# Deploy no Vercel

## Pré-requisitos

1. **Conta no Vercel**: Crie uma conta em [vercel.com](https://vercel.com)
2. **Variáveis de Ambiente**: Configure as seguintes variáveis no Vercel:
   - `MONGO_URI`: String de conexão do MongoDB Atlas
   - `JWT_SECRET`: Chave secreta para JWT
   - `CLOUDINARY_CLOUD_NAME`: Nome da cloud do Cloudinary
   - `CLOUDINARY_API_KEY`: API Key do Cloudinary
   - `CLOUDINARY_API_SECRET`: API Secret do Cloudinary
   - `NODE_ENV`: production

## Passos para Deploy

### Método 1: Deploy via CLI do Vercel

1. **Instalar Vercel CLI**:
   ```bash
   # Opção 1: Usar npx (recomendado - não requer instalação global)
   npx vercel
   
   # Opção 2: Instalar globalmente (pode precisar de sudo no macOS)
   sudo npm install -g vercel
   
   # Opção 3: Instalar localmente no projeto
   npm install vercel --save-dev
   ```

2. **Login no Vercel**:
   ```bash
   # Se usou npx
   npx vercel login
   
   # Se instalou globalmente
   vercel login
   
   # Se instalou localmente
   npx vercel login
   ```

3. **Fazer deploy**:
   ```bash
   # Deploy de desenvolvimento
   npx vercel
   ```

4. **Deploy de produção**:
   ```bash
   npx vercel --prod
   ```

### Método 2: Deploy via GitHub

1. **Push para GitHub**:
   ```bash
   git add .
   git commit -m "Configuração para deploy no Vercel"
   git push origin main
   ```

2. **Conectar repositório no Vercel**:
   - Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
   - Clique em "New Project"
   - Importe seu repositório do GitHub
   - Configure as variáveis de ambiente
   - Deploy automático será feito

## Configuração de Variáveis de Ambiente no Vercel

1. Acesse seu projeto no dashboard do Vercel
2. Vá em "Settings" > "Environment Variables"
3. Adicione cada variável:
   - Name: `MONGO_URI`
   - Value: `sua_string_de_conexao_mongodb`
   - Environment: Production, Preview, Development

## URLs de Acesso

Após o deploy, suas rotas estarão disponíveis em:
- `https://seu-projeto.vercel.app/api/auth/*`
- `https://seu-projeto.vercel.app/api/products/*`
- `https://seu-projeto.vercel.app/api/profile/*`
- `https://seu-projeto.vercel.app/api/cart/*`

## Notas Importantes

- O Vercel usa funções serverless, então cada requisição "desperta" a função
- Primeira requisição pode ter cold start (mais lenta)
- MongoDB Atlas é recomendado para banco de dados
- Certifique-se de que todas as variáveis de ambiente estejam configuradas

## Troubleshooting

### Problemas Comuns

- **Erro 500**: Verifique as variáveis de ambiente
- **Timeout**: Vercel tem limite de 10s para funções gratuitas
- **CORS**: Configuração já está liberada para qualquer origem

### Conflito de Dependências

Se você encontrar erro de peer dependencies como:
```
peer cloudinary@"^1.21.0" from multer-storage-cloudinary@4.0.0
```

Execute:
```bash
# Limpar dependências
rm -rf node_modules package-lock.json

# Reinstalar
npm install
```

**Nota**: O projeto já foi configurado com versões compatíveis do Cloudinary v1.41.3.

### Erro de Permissão (EACCES) no macOS

Se você receber erro `EACCES: permission denied` ao instalar o Vercel CLI:

**Solução 1 - Usar npx (Recomendado):**
```bash
# Não precisa instalar globalmente
npx vercel login
npx vercel --prod
```

**Solução 2 - Instalar com sudo:**
```bash
sudo npm install -g vercel
```

**Solução 3 - Configurar npm para não usar sudo:**
```bash
# Criar diretório para pacotes globais
mkdir ~/.npm-global

# Configurar npm para usar o novo diretório
npm config set prefix '~/.npm-global'

# Adicionar ao PATH (adicione esta linha ao seu ~/.zshrc)
export PATH=~/.npm-global/bin:$PATH

# Recarregar configuração
source ~/.zshrc

# Agora pode instalar sem sudo
npm install -g vercel
```
