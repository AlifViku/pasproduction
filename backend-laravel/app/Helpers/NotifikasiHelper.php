<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * NotifikasiHelper
 * Helper resmi untuk integrasi pengiriman pesan WhatsApp otomatis melalui API Fonnte
 * pada Sistem Pemesanan Baju Custom PAS Production.
 */
class NotifikasiHelper
{
    /**
     * Endpoint API Fonnte
     */
    protected static $fonnteUrl = 'https://api.fonnte.com/send';

    /**
     * Normalisasi nomor telepon ke format standar internasional WhatsApp (62xxx)
     */
    public static function formatNomorWhatsApp($nomor)
    {
        if (empty($nomor)) return '';

        $clean = preg_replace('/[^0-9]/', '', $nomor);

        if (str_starts_with($clean, '0')) {
            $clean = '62' . substr($clean, 1);
        } elseif (str_starts_with($clean, '8')) {
            $clean = '62' . $clean;
        }

        return $clean;
    }

    /**
     * Fungsi utama untuk mengirim pesan via HTTP Request ke Fonnte Gateway
     */
    public static function kirimPesan($target, $pesan)
    {
        $token = env('FONNTE_TOKEN');
        $targetFormatted = self::formatNomorWhatsApp($target);

        if (empty($token) || empty($targetFormatted)) {
            Log::warning('[Fonnte] Gagal mengirim pesan: Token atau nomor tujuan kosong.');
            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $token,
            ])->post(self::$fonnteUrl, [
                'target'      => $targetFormatted,
                'message'     => $pesan,
                'countryCode' => '',
            ]);

            $result = $response->json();

            if ($response->successful() && !empty($result['status'])) {
                Log::info("[Fonnte] Pesan WhatsApp berhasil terkirim ke: {$targetFormatted}");
                return true;
            }

            Log::error('[Fonnte] API Fonnte mengembalikan status gagal: ' . json_encode($result));
            return false;
        } catch (\Exception $e) {
            Log::error('[Fonnte] Terjadi kegagalan jaringan saat mengirim WhatsApp: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * 1. Mengirim notifikasi pembaruan status perkembangan produksi
     * Dipanggil pada: AdminOrderController@updateStatus
     * Sintaks: NotifikasiHelper::kirimUpdateStatus($pemesanan);
     */
    public static function kirimUpdateStatus($pemesanan)
    {
        // Ambil data pelanggan dan nomor telepon dari relasi user/akun
        $namaPelanggan = $pemesanan->user->name ?? $pemesanan->nama_pelanggan ?? 'Pelanggan';
        $nomorWa = $pemesanan->user->phone ?? $pemesanan->nomor_telepon ?? '';
        $status = $pemesanan->status ?? 'Diproses';

        // Penyesuaian narasi pesan berdasarkan tahapan produksi baju custom
        switch ($status) {
            case 'Desain Direview':
                $keterangan = "Progress pesanan baju custom Anda saat ini telah memasuki tahap review desain. Desain baju Anda sedang ditinjau oleh tim kami untuk memastikan kesesuaian dan resolusi cetak terbaik.";
                break;
            case 'Pemotongan Kain':
            case 'Pemotongan Bahan':
                $keterangan = "Progress pesanan baju custom Anda saat ini telah memasuki tahap pemotongan bahan. Bahan kain sedang dipotong sesuai ukuran dan spesifikasi pesanan Anda.";
                break;
            case 'Sablon / Bordir':
                $keterangan = "Progress pesanan baju custom Anda saat ini telah memasuki tahap sablon dan bordir. Artwork desain pesanan Anda sedang dalam proses pencetakan pada bahan pakaian.";
                break;
            case 'Penjahitan':
                $keterangan = "Progress pesanan baju custom Anda saat ini telah memasuki tahap penjahitan. Potongan bahan pakaian Anda sedang dirakit dan dijahit rapi oleh tim penjahit kami.";
                break;
            case 'Quality Control':
                $keterangan = "Progress pesanan baju custom Anda saat ini telah memasuki tahap quality control. Pakaian Anda sedang melalui pemeriksaan mutu jahitan dan sablon untuk memastikan hasil terbaik.";
                break;
            case 'Siap Dikirim':
                $keterangan = "Progress pesanan baju custom Anda saat ini telah memasuki tahap siap dikirim. Pakaian Anda telah selesai dipacking rapi dan siap dikirimkan ke alamat Anda.";
                break;
            case 'Selesai':
                $keterangan = "Pesanan baju custom Anda saat ini telah selesai sepenuhnya. Terima kasih telah mempercayakan pembuatan baju Anda kepada PAS Production!";
                break;
            default:
                $keterangan = "Progress pesanan baju custom Anda saat ini telah memasuki tahap " . strtolower($status) . ". Tim kami sedang memproses pesanan Anda sesuai spesifikasi.";
                break;
        }

        $pesan = "Halo, {$namaPelanggan}!\n\n{$keterangan}";

        return self::kirimPesan($nomorWa, $pesan);
    }

    /**
     * 2. Mengirim notifikasi pengingat sisa pelunasan pembayaran
     * Dipanggil pada: PaymentController / Scheduler
     * Sintaks: NotifikasiHelper::kirimPengingatPelunasan($pemesanan);
     */
    public static function kirimPengingatPelunasan($pemesanan)
    {
        $namaPelanggan = $pemesanan->user->name ?? $pemesanan->nama_pelanggan ?? 'Pelanggan';
        $nomorWa = $pemesanan->user->phone ?? $pemesanan->nomor_telepon ?? '';
        $idPesanan = $pemesanan->id ?? $pemesanan->kode_pesanan ?? '-';
        $nominal = number_format($pemesanan->sisa_pembayaran ?? $pemesanan->total_harga ?? 0, 0, ',', '.');

        $pesan = "Halo, {$namaPelanggan}!\n\n"
               . "Pesanan baju custom Anda dengan nomor pesanan *#{$idPesanan}* saat ini telah memasuki tahap akhir produksi / siap dikirim. "
               . "Mohon kesediaannya untuk melakukan pelunasan sisa tagihan sebesar *Rp {$nominal}* agar pesanan dapat segera kami kirimkan ke alamat Anda.\n\n"
               . "Terima kasih atas kerja sama dan kepercayaannya kepada PAS Production! 🙏✨";

        return self::kirimPesan($nomorWa, $pesan);
    }
}
