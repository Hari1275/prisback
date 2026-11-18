# Starter

PrisBack starter API (LoopBack IoC + OpenAPI + Prisma).

## Quick start

```bash
cp .env.example .env
npm install
npx prisma generate
npm run build
npm start
```

- API: http://127.0.0.1:3000/ping  
- OpenAPI: http://127.0.0.1:3000/openapi.json  

## Scaffold more

```bash
prisback g model Post
prisback g crud Post
prisback g relation
prisback g auth
```

After generating modules, register them in `src/application.ts`:

```ts
import {PostModule} from './modules/post/post.module';
this.component(PostModule);
```
