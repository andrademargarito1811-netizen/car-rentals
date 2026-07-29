import { useRef, useState } from 'react';
import DangerButton from '@/Components/DangerButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRoute } from 'ziggy-js';

interface DeleteUserFormProps {
    className?: string;
}

export default function DeleteUserForm({ className }: DeleteUserFormProps) {
    const route = useRoute();
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef<HTMLInputElement>(null);

    const form = useForm({ password: '' });

    function confirmUserDeletion() {
        setConfirmingUserDeletion(true);
        setTimeout(() => passwordInput.current?.focus(), 0);
    }

    function deleteUser() {
        form.delete(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current?.focus(),
            onFinish: () => form.reset(),
        });
    }

    function closeModal() {
        setConfirmingUserDeletion(false);
        form.clearErrors();
        form.reset();
    }

    return (
        <section className={`space-y-6 ${className || ''}`}>
            <header>
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Delete Account</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Once your account is deleted, all of its resources and data will be permanently deleted. Before deleting your account, please download any data or information that you wish to retain.
                </p>
            </header>

            <DangerButton onClick={confirmUserDeletion}>Delete Account</DangerButton>

            <Modal show={confirmingUserDeletion} onClose={closeModal}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Are you sure you want to delete your account?
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Once your account is deleted, all of its resources and data will be permanently deleted. Please enter your password to confirm you would like to permanently delete your account.
                    </p>

                    <div className="mt-6">
                        <InputLabel htmlFor="password" value="Password" className="sr-only" />
                        <TextInput
                            id="password"
                            ref={passwordInput}
                            value={form.data.password}
                            onChange={e => form.setData('password', e.target.value)}
                            type="password"
                            className="mt-1 block w-3/4"
                            placeholder="Password"
                            onKeyUp={(e) => { if (e.key === 'Enter') deleteUser(); }}
                        />
                        <InputError message={form.errors.password} className="mt-2" />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
                        <DangerButton
                            className={`ms-3 ${form.processing ? 'opacity-25' : ''}`}
                            disabled={form.processing}
                            onClick={deleteUser}
                        >
                            Delete Account
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </section>
    );
}
