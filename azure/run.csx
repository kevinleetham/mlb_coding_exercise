#r "Newtonsoft.Json"
using System.Net;
using Newtonsoft.Json;
using System.Text;

// This API proxies calls to the MLB API which does not support CORS requests
// Parameters:
//  year: 4 digit year (e.g. 2018)
//  month: 2 digit month (e.g. 05)
//  day: 2 digit day (e.g. 11)
// Returns the same JSON the MLB API returns if successful with a 200 OK,
// or 400 Bad Request if parameters are missing.
// If the MLB API returns bad data, this will just be passed through. 
// Note: This API does not have security (like the MLB API) but probably should in production
public static async Task<HttpResponseMessage> Run(HttpRequestMessage req, TraceWriter log)
{
    log.Info("C# HTTP trigger function processed a request.");

    // Parse query parameters
    var pairs = req.GetQueryNameValuePairs();
    string year = pairs.FirstOrDefault(q => string.Compare(q.Key, "year", true) == 0).Value;
    string month = pairs.FirstOrDefault(q => string.Compare(q.Key, "month", true) == 0).Value;
    string day = pairs.FirstOrDefault(q => string.Compare(q.Key, "day", true) == 0).Value;

    if (year == null || month == null || day == null)
    {
        return new HttpResponseMessage(HttpStatusCode.BadRequest){
            Content = new StringContent(JsonConvert.SerializeObject(new {error = "year, month, and day are required"}), Encoding.UTF8, "application/json")
        };
    }

    // Pass the call to the MLB API
    using (var client = new HttpClient()){
        client.BaseAddress = new Uri($"http://gdx.mlb.com/components/game/mlb/year_{year}/month_{month}/day_{day}/master_scoreboard.json");
        var result = await client.GetAsync("");
        string resultContent = await result.Content.ReadAsStringAsync();
        return new HttpResponseMessage(HttpStatusCode.OK){
            Content = new StringContent(resultContent, Encoding.UTF8, "application/json")
        };
    }
    
}
