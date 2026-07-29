import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { Head } from '@inertiajs/react';

interface ProfileEditProps {
    mustVerifyEmail?: boolean;
    status?: string;
}

export default function ProfileEdit({ mustVerifyEmail, status }: ProfileEditProps) {
    return (
        <>
            <Head title="Profile" />
            <AuthenticatedLayout header={<h2 className="text-2xl font-bold text-surface-900">Profile</h2>}>
                <div className="py-8 sm:py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                        <div className="card p-6 sm:p-8">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-xl"
                            />
                        </div>

                        <div className="card p-6 sm:p-8">
                            <UpdatePasswordForm className="max-w-xl" />
                        </div>

                        <div className="card p-6 sm:p-8">
                            <DeleteUserForm className="max-w-xl" />
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}
