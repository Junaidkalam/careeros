import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;

public class JsoupTest {
    public static void main(String[] args) {
        String url = "https://www.glassdoor.co.in/job-listing/social-media-executive-mind-and-matter-JV_KO0,24_KE25,40.htm?jl=1010251676309";
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .ignoreHttpErrors(true)
                    .get();
            System.out.println("Title: " + doc.title());
            System.out.println("Contains cloudflare? " + doc.html().toLowerCase().contains("cloudflare"));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}