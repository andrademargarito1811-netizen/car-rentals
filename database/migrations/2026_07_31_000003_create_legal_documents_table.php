<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('legal_documents', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->longText('content');
            $table->string('type')->default('website')->comment('website or invoice');
            $table->integer('version')->default(1);
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
        });

        $docs = [
            [
                'slug' => 'privacy-policy',
                'title' => 'Privacy Policy',
                'subtitle' => 'How we collect, use, and protect your personal information.',
                'type' => 'website',
                'version' => 1,
                'content' => '<p>West Car Rentals ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.</p>
<h2>1. Information We Collect</h2>
<h3>Personal Information</h3>
<p>We may collect personally identifiable information such as:</p>
<ul>
<li>Name, email address, phone number, and mailing address</li>
<li>Driver\'s license number and other identification details</li>
<li>Payment information (processed securely through our payment partners)</li>
<li>Date of birth and age verification</li>
</ul>
<h3>Non-Personal Information</h3>
<p>We automatically collect certain non-personal information when you visit our website:</p>
<ul>
<li>Browser type and version</li>
<li>IP address and device information</li>
<li>Pages visited and time spent on our site</li>
<li>Referring website addresses</li>
</ul>
<h2>2. How We Use Your Information</h2>
<p>We use the collected information for the following purposes:</p>
<ul>
<li>To process and manage your vehicle reservations</li>
<li>To communicate with you about your bookings and inquiries</li>
<li>To improve our website and customer service</li>
<li>To send promotional offers and updates (with your consent)</li>
<li>To comply with legal obligations and prevent fraud</li>
</ul>
<h2>3. Information Sharing</h2>
<p>We do not sell your personal information. We may share your information with:</p>
<ul>
<li>Service providers who assist in our business operations (payment processing, customer support)</li>
<li>Law enforcement or regulatory authorities when required by law</li>
<li>Business partners with your explicit consent</li>
</ul>
<h2>4. Data Security</h2>
<p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. All payment transactions are encrypted using industry-standard SSL technology.</p>
<h2>5. Your Rights</h2>
<p>You have the right to:</p>
<ul>
<li>Access your personal information held by us</li>
<li>Request correction of inaccurate information</li>
<li>Request deletion of your information (subject to legal requirements)</li>
<li>Opt out of marketing communications at any time</li>
<li>Withdraw consent where processing is based on consent</li>
</ul>
<h2>6. Cookies</h2>
<p>Our website uses cookies to enhance your browsing experience. You can control cookie settings through your browser preferences. Please refer to our Cookie Policy for more detailed information.</p>
<h2>7. Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@westcarsales.com">privacy@westcarsales.com</a> or call us at +1 (800) 555-WEST.</p>',
            ],
            [
                'slug' => 'terms-of-service',
                'title' => 'Terms of Service',
                'subtitle' => 'Please read these terms carefully before using our services.',
                'type' => 'website',
                'version' => 1,
                'content' => '<p>By accessing or using the West Car Rentals website and services, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you should not use our services.</p>
<h2>1. Rental Eligibility</h2>
<ul>
<li>You must be at least 21 years of age to rent a vehicle (age requirements may vary by location)</li>
<li>A valid driver\'s license held for a minimum of one year is required</li>
<li>A valid credit card in the renter\'s name must be provided at pick-up</li>
<li>International renters must provide a valid passport and international driver\'s permit if required</li>
</ul>
<h2>2. Reservations and Payments</h2>
<ul>
<li>All reservations are subject to vehicle availability</li>
<li>Rates are quoted in USD and include applicable taxes unless stated otherwise</li>
<li>A valid credit card is required to guarantee all reservations</li>
<li>Cancellation policies vary by rate type and will be disclosed at the time of booking</li>
<li>No-shows may be charged the full rental amount</li>
</ul>
<h2>3. Vehicle Use</h2>
<ul>
<li>Vehicles must not be used for illegal activities</li>
<li>Unauthorized drivers are strictly prohibited</li>
<li>Vehicles must not be driven off paved roads unless specifically permitted</li>
<li>Smoking is prohibited in all rental vehicles (a cleaning fee will apply)</li>
<li>Pets are allowed only with prior approval and may incur additional fees</li>
</ul>
<h2>4. Insurance and Liability</h2>
<p>Renters are responsible for the vehicle during the rental period. Various insurance options are available:</p>
<ul>
<li>Collision Damage Waiver (CDW) reduces financial liability for damage</li>
<li>Liability Insurance is included as required by law</li>
<li>Personal Accident Insurance is available upon request</li>
<li>Renter\'s personal insurance may provide coverage; please check with your provider</li>
</ul>
<h2>5. Fuel Policy</h2>
<p>Vehicles are provided with a full tank of fuel and must be returned with a full tank. If the vehicle is returned with less fuel, a refueling service charge will apply. Pre-purchase fuel options may be available at discounted rates.</p>
<h2>6. Late Returns</h2>
<p>A grace period of 29 minutes is provided. Returns beyond the grace period may incur additional hourly charges up to a full day\'s rental rate. Extensions must be authorized in advance.</p>
<h2>7. Modifications to Terms</h2>
<p>We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to our website. Continued use of our services after any changes constitutes acceptance of the new terms.</p>
<h2>8. Contact Information</h2>
<p>For questions about these Terms of Service, please contact us at <a href="mailto:support@westcarsales.com">support@westcarsales.com</a> or call +1 (800) 555-WEST.</p>',
            ],
            [
                'slug' => 'cookie-policy',
                'title' => 'Cookie Policy',
                'subtitle' => 'How we use cookies and similar technologies on our website.',
                'type' => 'website',
                'version' => 1,
                'content' => '<p>West Car Rentals ("we," "our," or "us") uses cookies and similar tracking technologies on our website. This Cookie Policy explains what cookies are, how we use them, and your choices regarding cookies.</p>
<h2>1. What Are Cookies?</h2>
<p>Cookies are small text files that are placed on your device (computer, tablet, or mobile) when you visit a website. They help the website remember your preferences, enhance your browsing experience, and provide useful information to website operators.</p>
<h2>2. Types of Cookies We Use</h2>
<h3>Essential Cookies</h3>
<p>These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and account access. You cannot opt out of these cookies.</p>
<h3>Performance Cookies</h3>
<p>These cookies collect information about how visitors use our website, such as which pages are visited most often. This data helps us improve the performance and design of our site.</p>
<h3>Functional Cookies</h3>
<p>These cookies allow the website to remember choices you make (such as your language preference or location) and provide enhanced, personalized features.</p>
<h3>Targeting/Advertising Cookies</h3>
<p>These cookies are used to deliver advertisements more relevant to you and your interests. They may be set through our site by advertising partners to build a profile of your interests.</p>
<h2>3. Third-Party Cookies</h2>
<p>Some cookies are placed by third-party services that appear on our pages. These third parties may include analytics providers (such as Google Analytics) and advertising networks. We do not control these cookies, and you should check the third-party websites for more information about their cookie practices.</p>
<h2>4. How to Manage Cookies</h2>
<p>Most web browsers allow you to control cookies through their settings. You can typically:</p>
<ul>
<li>View cookies stored on your device and delete them individually</li>
<li>Block all cookies or third-party cookies</li>
<li>Set your browser to notify you when a cookie is being set</li>
<li>Use private or incognito browsing modes</li>
</ul>
<p>Please note that disabling certain cookies may affect the functionality and performance of our website.</p>
<h2>5. Changes to This Policy</h2>
<p>We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.</p>
<h2>6. Contact Us</h2>
<p>If you have any questions about our use of cookies, please contact us at <a href="mailto:privacy@westcarsales.com">privacy@westcarsales.com</a> or call +1 (800) 555-WEST.</p>',
            ],
            [
                'slug' => 'terms-and-conditions',
                'title' => 'Terms and Conditions',
                'subtitle' => 'The terms and conditions governing the use of our website and services.',
                'type' => 'website',
                'version' => 1,
                'content' => '<p>Welcome to West Car Rentals. By accessing our website and using our services, you agree to be bound by the following terms and conditions. Please read them carefully before proceeding with any booking or transaction.</p>
<h2>1. Definitions</h2>
<ul>
<li>"Company," "we," "us," or "our" refers to West Car Rentals</li>
<li>"Customer," "you," or "your" refers to the person renting the vehicle or using the website</li>
<li>"Vehicle" refers to the rental vehicle provided under the rental agreement</li>
<li>"Rental Agreement" refers to the contract signed at the time of vehicle pick-up</li>
</ul>
<h2>2. Booking and Payment</h2>
<ul>
<li>All bookings are subject to vehicle availability and confirmation by West Car Rentals</li>
<li>A valid credit card is required to secure all reservations</li>
<li>Payment is due at the time of pick-up unless otherwise agreed</li>
<li>Prices are subject to change without notice until a booking is confirmed</li>
<li>All applicable taxes and fees will be disclosed prior to completing your booking</li>
</ul>
<h2>3. Cancellation and Refunds</h2>
<ul>
<li>Cancellations made 48 hours or more before pick-up are eligible for a full refund</li>
<li>Cancellations made within 48 hours may incur a cancellation fee equal to one day\'s rental</li>
<li>No-shows will be charged the full rental amount</li>
<li>Early returns do not qualify for refunds of unused rental days</li>
<li>Refunds are processed within 5-10 business days to the original payment method</li>
</ul>
<h2>4. Customer Responsibilities</h2>
<ul>
<li>You must return the vehicle in the same condition as received, subject to normal wear and tear</li>
<li>You are responsible for all traffic violations, tolls, and parking fines incurred during the rental period</li>
<li>You must notify us immediately in case of an accident or damage</li>
<li>Smoking is strictly prohibited inside all vehicles</li>
<li>The vehicle must not be used to transport hazardous materials</li>
</ul>
<h2>5. Limitation of Liability</h2>
<p>To the fullest extent permitted by law, West Car Rentals shall not be liable for:</p>
<ul>
<li>Any indirect, incidental, or consequential damages arising from the rental</li>
<li>Loss or damage to personal property left in the vehicle</li>
<li>Any costs incurred due to vehicle breakdown, subject to our roadside assistance policy</li>
<li>Delays or cancellations caused by events beyond our reasonable control</li>
</ul>
<h2>6. Governing Law</h2>
<p>These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which the rental takes place. Any disputes arising from these terms shall be resolved in the courts of that jurisdiction.</p>
<h2>7. Severability</h2>
<p>If any provision of these terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.</p>
<h2>8. Contact Information</h2>
<p>For questions or concerns regarding these Terms and Conditions, please contact us at <a href="mailto:support@westcarsales.com">support@westcarsales.com</a> or call +1 (800) 555-WEST. You may also write to us at 123 Auto Drive, Motor City, MC 12345.</p>',
            ],
            [
                'slug' => 'invoice-terms-online',
                'title' => 'Agreement Text - 1',
                'subtitle' => 'Terms and conditions applied to invoices issued for online reservations.',
                'type' => 'invoice',
                'version' => 1,
                'content' => '<p>These invoice terms apply to all rental invoices issued for bookings made through our online reservation system. By accepting a vehicle, the customer agrees to the following terms.</p>
<h2>1. Invoice Issuance</h2>
<p>An invoice will be issued upon confirmation of the booking and again at vehicle pick-up. Invoices are the official record of charges for the rental period.</p>
<h2>2. Payment Terms</h2>
<ul>
<li>Full payment is due at the time of pick-up unless otherwise agreed in writing</li>
<li>All charges are quoted in USD and include applicable taxes unless stated otherwise</li>
<li>Any additional charges (fuel, tolls, damage) will be invoiced after vehicle return</li>
</ul>
<h2>3. Late Payment</h2>
<p>Late payments may incur a finance charge of 1.5% per month and may result in suspension of the rental account.</p>',
            ],
            [
                'slug' => 'invoice-terms-walkin',
                'title' => 'Agreement Text - 2',
                'subtitle' => 'Terms and conditions applied to invoices issued for on-site rentals.',
                'type' => 'invoice',
                'version' => 1,
                'content' => '<p>These invoice terms apply to all rental invoices issued for walk-in (on-site) rentals at any of our branches. By signing the rental agreement, the customer agrees to the following terms.</p>
<h2>1. Invoice Issuance</h2>
<p>An invoice will be issued at the time of vehicle pick-up. A final invoice including all charges will be provided upon vehicle return.</p>
<h2>2. Payment Terms</h2>
<ul>
<li>Payment is due at the time of vehicle pick-up</li>
<li>We accept major credit cards, debit cards, and cash</li>
<li>Additional charges incurred during the rental will be invoiced upon return</li>
</ul>
<h2>3. Deposit</h2>
<p>A refundable security deposit may be required at the time of pick-up. The deposit will be released after inspection of the returned vehicle, subject to any deductions for damage or additional charges.</p>',
            ],
        ];

        foreach ($docs as $doc) {
            $doc['is_active'] = true;
            $doc['created_at'] = now();
            $doc['updated_at'] = now();
            DB::table('legal_documents')->insert($doc);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_documents');
    }
};
