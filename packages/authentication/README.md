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

## Contributions

- [Guidelines](https://github.com/Hari1275/prisback/blob/main/CONTRIBUTING.md)
- [Open an issue](https://github.com/Hari1275/prisback/issues)

## License

MIT — see the root [`LICENSE`](https://github.com/Hari1275/prisback/blob/main/LICENSE).

PrisBack is an independent MIT-licensed fork based on LoopBack 4 core. It is **not** affiliated with or endorsed by IBM or the LoopBack project.

