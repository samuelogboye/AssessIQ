import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Mail, Lock, Shield, Trash2 } from 'lucide-react'
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@/components/ui'
import { useAuth, useUpdateProfile, useChangePassword } from '@/features/auth'
import {
  profileUpdateSchema,
  changePasswordSchema,
  type ProfileUpdateFormData,
  type ChangePasswordFormData,
  getPasswordStrength,
} from '@/lib/validation'
import { formatDate } from '@/lib/utils'

export default function Profile() {
  const { user } = useAuth()
  const [showChangePassword, setShowChangePassword] = useState(false)
  const updateProfileMutation = useUpdateProfile()
  const changePasswordMutation = useChangePassword()

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      new_password_confirm: '',
    },
  })

  const newPassword = watchPassword('new_password')
  const passwordStrength = getPasswordStrength(newPassword || '')

  const onProfileSubmit = (data: ProfileUpdateFormData) => {
    updateProfileMutation.mutate(data)
  }

  const onPasswordSubmit = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        resetPassword()
        setShowChangePassword(false)
      },
    })
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Profile Settings</h1>
        <p className="text-neutral-400">Manage your account information and preferences</p>
      </div>

      {/* Profile Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary-700 flex items-center justify-center">
              <span className="text-2xl font-bold text-neutral-300">
                {user.first_name?.[0]}
                {user.last_name?.[0]}
              </span>
            </div>
            <div>
              <CardTitle>{user.full_name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                leftIcon={<User className="h-5 w-5" />}
                error={profileErrors.first_name?.message}
                {...registerProfile('first_name')}
              />
              <Input
                label="Last Name"
                error={profileErrors.last_name?.message}
                {...registerProfile('last_name')}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!isProfileDirty}
                isLoading={updateProfileMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-neutral-400">Role</p>
              <Badge variant="accent" className="mt-1 capitalize">
                {user.role}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-neutral-400">Email Status</p>
              <Badge variant={user.is_verified ? 'success' : 'warning'} className="mt-1">
                {user.is_verified ? 'Verified' : 'Not Verified'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-neutral-400">Member Since</p>
              <p className="text-neutral-100">{formatDate(user.date_joined)}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-400">Last Login</p>
              <p className="text-neutral-100">
                {user.last_login ? formatDate(user.last_login) : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password
            </CardTitle>
            {!showChangePassword && (
              <Button variant="secondary" size="sm" onClick={() => setShowChangePassword(true)}>
                Change Password
              </Button>
            )}
          </div>
        </CardHeader>
        {showChangePassword && (
          <CardContent>
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                error={passwordErrors.old_password?.message}
                {...registerPassword('old_password')}
              />
              <div>
                <Input
                  label="New Password"
                  type="password"
                  error={passwordErrors.new_password?.message}
                  {...registerPassword('new_password')}
                />
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-primary-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-400">{passwordStrength.label}</span>
                    </div>
                  </div>
                )}
              </div>
              <Input
                label="Confirm New Password"
                type="password"
                error={passwordErrors.new_password_confirm?.message}
                {...registerPassword('new_password_confirm')}
              />
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowChangePassword(false)
                    resetPassword()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={changePasswordMutation.isPending}>
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Danger Zone */}
      <Card className="border-error/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-error">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Once you delete your account, there is no going back. Please be certain.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  )
}
