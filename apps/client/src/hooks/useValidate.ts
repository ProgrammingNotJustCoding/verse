import { ZodObject } from 'zod'

type Errors = { [key: string]: string }

export function useValidate<T extends ZodObject<any>>(
  validator: T,
  setErrors: React.Dispatch<React.SetStateAction<Errors>>,
  isSignUp: boolean,
  formData: Record<string, any>
) {
  function validateField(field: 'name' | 'email' | 'password') {
    if (field === 'name' && !isSignUp) return
    try {
      const schema = validator.shape[field as keyof typeof validator.shape]
      if (!schema) return
      schema.parse(formData[field])
      setErrors(prev => ({ ...prev, [field]: '' }))
    } catch (err: any) {
      if (err.issues?.[0]?.message) {
        setErrors(prev => ({ ...prev, [field]: err.issues[0].message }))
      }
    }
  }

  function validateForm() {
    try {
      const data = isSignUp
        ? { name: formData.name, email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password }
      validator.parse(data)
      setErrors({})
      return true
    } catch (err: any) {
      const fieldErrors: Errors = {}
      err.errors?.forEach((e: any) => {
        fieldErrors[e.path[0]] = e.message
      })
      setErrors(fieldErrors)
      return false
    }
  }

  return { validateField, validateForm }
}
