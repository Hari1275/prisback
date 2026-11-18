# `@prisback/authentication`

Basic JWT auth for PrisBack (email/password + Bearer token).

## Usage

```ts
import {AuthenticationComponent, authenticate} from '@prisback/authentication';

app.component(AuthenticationComponent);
app.configure(TokenServiceBindings.TOKEN_SERVICE).to({
  secret: process.env.JWT_SECRET ?? 'change-me',
  expiresIn: '1h',
});

class NotesController {
  @authenticate('jwt')
  @get('/notes')
  list() { /* requires Authorization: Bearer <token> */ }
}
```

Generate app scaffolding with:

```bash
prisback g auth
```
