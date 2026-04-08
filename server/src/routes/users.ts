import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import {
  createUserRequestSchema,
  getMeResponseSchema,
  listUsersResponseSchema,
  loginRequestSchema,
  loginResponseSchema,
} from "../../../shared/src/schemas/user";
import { createUser, getUserByCredentials, getUserById, listUsers } from "../services/user-service";
import { HttpError } from "../errors";

// Setup Auth context with JWT and Cookie
export const userRoutes = new Elysia({ prefix: "/users" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-pb138",
    })
  )
  .derive(async ({ jwt, cookie: { auth_session } }) => {
    return {
      getCurrentUser: async () => {
        if (!auth_session || !auth_session.value) {
          throw new HttpError(401, "Unauthorized");
        }
        
        const profile = await jwt.verify(auth_session.value as string);
        if (!profile || !profile.id) {
          throw new HttpError(401, "Unauthorized");
        }
        
        // This validates the token ID exists in the DB
        return await getUserById(Number(profile.id));
      }
    };
  })
  
  // Public Login
  .post("/login", async ({ body, jwt, cookie: { auth_session } }) => {
    const parsedBody = loginRequestSchema.parse(body);
    const user = await getUserByCredentials(parsedBody);
    
    // Sign JWT
    const token = await jwt.sign({
      id: user.id,
      role: user.roleName,
      exp: Math.floor(Date.now() / 1000) + (7 * 86400) // 7 days expiration
    });
    
    // Set HttpOnly cookie
    auth_session.set({
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 7 * 86400,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    
    return loginResponseSchema.parse({ message: "Logged in successfully" });
  })
  
  // Register (Often protected, but public for demo if needed. Assuming public for bootstrapping)
  .post("", async ({ body }) => {
    const parsedBody = createUserRequestSchema.parse(body);
    const user = await createUser(parsedBody);
    // You could immediately sign them in, but standard is force login
    return { data: user };
  })
  
  // Public Logout
  .post("/logout", ({ cookie: { auth_session } }) => {
    auth_session.remove();
    return { message: "Logged out" };
  })

  // Protected: Get Me
  .get("/me", async ({ getCurrentUser }) => {
    const user = await getCurrentUser();
    return getMeResponseSchema.parse({ data: user });
  })

  // Protected: List Users
  .get("", async ({ getCurrentUser }) => {
    await getCurrentUser(); // Guard
    const data = await listUsers();
    return listUsersResponseSchema.parse({ data });
  });
