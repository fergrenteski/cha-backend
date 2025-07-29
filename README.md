# cha-backend

Backend REST API usando Express.js, JWT, MongoDB, com rotas para produtos, autenticação, perfil, exclusão de usuário e carrinho persistente para usuários e convidados.

## Scripts
- `npm start`: Inicia o servidor

## Estrutura
- `/models`: Modelos do banco de dados
- `/routes`: Rotas da API
- `/controllers`: Lógica das rotas
- `/middleware`: Middlewares (JWT, autenticação)

## Configuração
Crie um arquivo `.env` com as variáveis:
```
MONGO_URI=seu_mongo_uri
JWT_SECRET=sua_chave_jwt
```

## Endpoints principais
- `/api/auth` - login, registro, logout
- `/api/products` - CRUD de produtos
- `/api/profile` - atualização/exclusão de perfil
- `/api/cart` - operações do carrinho

## Observação
Convidados também possuem carrinho persistente vinculado por token.
