  // import { loadEnv, defineConfig } from '@medusajs/framework/utils'

  // loadEnv(process.env.NODE_ENV || 'development', process.cwd())

  // module.exports = defineConfig({
  //   projectConfig: {
  //     databaseUrl: process.env.DATABASE_URL,
  //     http: {
  //       storeCors: process.env.STORE_CORS!,
  //       adminCors: process.env.ADMIN_CORS!,
  //       authCors: process.env.AUTH_CORS!,
  //       jwtSecret: process.env.JWT_SECRET || "supersecret",
  //       cookieSecret: process.env.COOKIE_SECRET || "supersecret",
  //     }
  //   },
  //   modules: [
  //     {
  //       resolve: "./src/modules/loyalty",
  //     },
  //   ],
  // })


//   import { loadEnv, defineConfig } from '@medusajs/framework/utils'

// loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// module.exports = defineConfig({
//   projectConfig: {
//     databaseUrl: process.env.DATABASE_URL,
//     http: {
//       storeCors: process.env.STORE_CORS!,
//       adminCors: process.env.ADMIN_CORS!,
//       authCors: process.env.AUTH_CORS!,
//       jwtSecret: process.env.JWT_SECRET || "supersecret",
//       cookieSecret: process.env.COOKIE_SECRET || "supersecret",
//     }
//   },
//   modules: [
//     {
//       resolve: "./src/modules/loyalty",
//     },
//     {
//       resolve: "./src/modules/product-review",
//     }
//   ],
//   plugins: [
//     {
//       resolve: "medusa-plugin-wishlist",
//       options: {},
//     },
//   ],
// })


import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "./src/modules/loyalty",
    },
    {
      resolve: "./src/modules/product-review",
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
            },
          },
        ],
      },
    },
  ],
  plugins: [
    {
      resolve: "medusa-plugin-wishlist",
      options: {},
    },
  ],
})