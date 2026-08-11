<x-mail::message>
# Welcome to {{ config('app.name') }}

Hello **{{ $user->name }}**,

An account has been created for you at **{{ config('app.name') }}**.

<x-mail::panel>
**Email:** {{ $user->email }}

Your password was provided to you separately — for security we never send passwords by email.
</x-mail::panel>

<x-mail::button :url="route('login')">
Login to Your Account
</x-mail::button>

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
