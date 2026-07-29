<x-mail::message>
# Welcome to {{ config('app.name') }}

Hello **{{ $user->name }}**,

An account has been created for you at **{{ config('app.name') }}**.

Here are your login credentials:

<x-mail::panel>
**Email:** {{ $user->email }}

**Password:** `{{ $password }}`
</x-mail::panel>

<x-mail::button :url="route('login')">
Login to Your Account
</x-mail::button>

For security, please change your password after logging in.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
