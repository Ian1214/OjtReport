<x-mail::message>
# Set up your OJT Report account

Hello {{ $recipientName }},

{{ $companyName }} has created your OJT Report account. Use the secure link below to choose your own password and activate your account.

<x-mail::panel>
**Login email**  
{{ $email }}
</x-mail::panel>

<x-mail::button :url="$setupUrl">
Set up my account
</x-mail::button>

For your security, this link expires automatically. If it expires, ask your company administrator to resend your account setup email.

Thanks,<br>
{{ config('app.name') }}
</x-mail::message>
