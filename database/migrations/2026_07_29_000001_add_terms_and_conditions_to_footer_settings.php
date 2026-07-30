<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $defaultLinks = [
        'Privacy Policy' => '/privacy-policy',
        'Terms of Service' => '/terms-of-service',
        'Cookie Policy' => '/cookie-policy',
        'Terms and Conditions' => '/terms-and-conditions',
    ];

    public function up(): void
    {
        $settings = DB::table('footer_settings')->get();

        foreach ($settings as $setting) {
            $legalLinks = json_decode($setting->legal_links, true) ?? [];
            $existingLabels = array_column($legalLinks, 'label');

            foreach ($this->defaultLinks as $label => $url) {
                $key = array_search($label, $existingLabels);

                if ($key !== false) {
                    $legalLinks[$key]['url'] = $url;
                } else {
                    $legalLinks[] = ['label' => $label, 'url' => $url];
                }
            }

            DB::table('footer_settings')
                ->where('id', $setting->id)
                ->update(['legal_links' => json_encode($legalLinks)]);
        }
    }

    public function down(): void
    {
        $settings = DB::table('footer_settings')->get();

        foreach ($settings as $setting) {
            $legalLinks = json_decode($setting->legal_links, true) ?? [];
            $legalLinks = array_values(array_filter($legalLinks, fn($link) => !isset($this->defaultLinks[$link['label']])));

            DB::table('footer_settings')
                ->where('id', $setting->id)
                ->update(['legal_links' => json_encode($legalLinks)]);
        }
    }
};
