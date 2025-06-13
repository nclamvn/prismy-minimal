import { prisma } from '@/lib/prisma'

export class AuthService {
 static async verifyApiKey(key: string) {
   const apiKey = await prisma.apiKey.findUnique({
     where: { key },
     include: { user: true }
   })

   if (!apiKey || !apiKey.active) {
     return null
   }

   // Update last used
   await prisma.apiKey.update({
     where: { id: apiKey.id },
     data: { 
       lastUsed: new Date(),
       lastUsedAt: new Date()
     }
   })

   return apiKey
 }

 static async getUserFromEmail(email: string) {
   return prisma.user.findUnique({
     where: { email }
   })
 }

 static async createApiRequest(
   apiKeyId: string,
   data: {
     endpoint: string
     method: string
     status: number
     duration: number
     tier?: string
   }
 ) {
   return prisma.apiRequest.create({
     data: {
       apiKeyId,
       ...data
     }
   })
 }
}
