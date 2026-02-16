'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

import { useAuthStore } from '@repo/store'

import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Label } from '@workspace/ui/components/label'

type FormData = {
  email: string
  password: string
}

export default function AuthPage() {
  const router = useRouter()

  const {
    mode,
    message,
    setMessage,
    togglePassword,
    showpassword,
    toggleMode,
    clearMessage,
  } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>()

  async function onSubmit(data: FormData) {
    clearMessage()

    const url =
      mode === 'login' ? '/api/login' : '/api/signup'

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    const result = await res.json()

    if (!res.ok) {
      setMessage(result.message)
      return
    }

    if (mode === 'login') {
      router.push('/work')
    } else {
      toggleMode()
      reset()
      setMessage('Signup success. Please login.')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">

      <Card className="w-full max-w-md shadow-lg">

        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            {mode === 'login' ? 'Login' : 'Create Account'}
          </CardTitle>

          <CardDescription>
            {mode === 'login'
              ? 'Enter your credentials to access your account'
              : 'Fill in details to create a new account'}
          </CardDescription>
        </CardHeader>

        <CardContent>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>

              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email', {
                  required: 'Email required',
                })}
              />

              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

          
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>

              <Input
                id="password"
                 type={showpassword ? "text" : "password"}
                placeholder="••••••••"
                
              {...register('password', {
              required: 'Password required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
})}

              />
              <button
  type="button"
  onClick={togglePassword}
  className="text-sm text-blue-500 mt-1"
>
  {showpassword ? "Hide" : "Show"}
</button>


              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            
            {message && (
              <p className="text-sm text-destructive text-center">
                {message}
              </p>
            )}

           
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Loading...'
                : mode === 'login'
                ? 'Login'
                : 'Sign Up'}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-4 text-center text-sm">

            <button
              type="button"
              onClick={() => {
                toggleMode()
                reset()
              }}
              className="text-primary underline-offset-4 hover:underline"
            >
              {mode === 'login'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Login'}
            </button>

          </div>

        </CardContent>

      </Card>
    </div>
  )
}
