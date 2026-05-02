// Default URL for triggering event grid function in the local environment.
// http://localhost:7071/runtime/webhooks/EventGrid?functionName={functionname}

using System; 
using System.Threading.Tasks; 
using Azure; 
using Azure.Core.Pipeline; 
using Azure.DigitalTwins.Core; 
using Azure.Identity; 
using Azure.Messaging; 
using Microsoft.Azure.Functions.Worker; 
using Microsoft.Azure.Functions.Worker.Extensions.EventGrid; 
using Microsoft.Extensions.Logging; 
using Newtonsoft.Json; 
using Newtonsoft.Json.Linq;

namespace Elderly { 
    public class ElderlyEventGrid { 
        private readonly ILogger _logger; 
        private static readonly string adtInstanceUrl = Environment.GetEnvironmentVariable("ADT_SERVICE_URL"); 
        private static readonly HttpClient singletonHttpClientInstance = new HttpClient();
            public ElderlyEventGrid(ILogger<ElderlyEventGrid> logger)
    {
        _logger = logger;
    }

    [Function(nameof(ElderlyEventGrid))]
    public async Task Run([EventGridTrigger] CloudEvent cloudEvent)
    {
        if (adtInstanceUrl == null)
        {
            _logger.LogError("Application setting \"ADT_SERVICE_URL\" not set");
            return;
        }

        try
        {
            var cred = new DefaultAzureCredential();
            var client = new DigitalTwinsClient(
                new Uri(adtInstanceUrl),
                cred,
                new DigitalTwinsClientOptions
                {
                    Transport = new HttpClientTransport(singletonHttpClientInstance)
                });
            _logger.LogInformation("ADT service client connection created.");

            // Generate random sensor data
                Random rand = new Random();
                double dht_temp = rand.Next(20, 35);  // Random temperature between 20 and 35°C
                double dht_hum = rand.Next(30, 70);  // Random humidity between 30% and 70%
                double lm35_temp = rand.Next(25, 40); // Random LM35 temperature between 25 and 40°C
                double spo2 = rand.Next(90, 100);  // Random SpO2 between 90 and 100
                double bpm = rand.Next(60, 100);  // Random heart rate between 60 and 100 bpm
                double gps_lat = rand.NextDouble() * (90 - (-90)) + (-90); // Random latitude
                double gps_lng = rand.NextDouble() * (180 - (-180)) + (-180); // Random longitude
                double gps_alt = rand.Next(0, 5000);  // Random altitude between 0 and 5000 meters
                double gps_speed = rand.Next(0, 50);  // Random speed between 0 and 50 km/h
                double acc_x = rand.Next(-10, 10);  // Random accelerometer X value
                double acc_y = rand.Next(-10, 10);  // Random accelerometer Y value
                double acc_z = rand.Next(-10, 10);  // Random accelerometer Z value
                double gyro_x = rand.Next(-180, 180);  // Random gyroscope X value
                double gyro_y = rand.Next(-180, 180);  // Random gyroscope Y value
                double gyro_z = rand.Next(-180, 180);  // Random gyroscope Z value


            if (cloudEvent != null && cloudEvent.Data != null)
            {
                _logger.LogInformation(cloudEvent.Data.ToString());

                // Convert the message into a JSON object
                JObject deviceMessage = (JObject)JsonConvert.DeserializeObject(cloudEvent.Data.ToString());

                var encodedBody = (string)deviceMessage["body"];
                var decodedBodyBytes = Convert.FromBase64String(encodedBody);
                var decodedBodyString = System.Text.Encoding.UTF8.GetString(decodedBodyBytes);
                var body = JObject.Parse(decodedBodyString);
                _logger.LogInformation($"Decoded body - {body.ToString()}");

                // Get device ID, temperature, humidity, and other sensor data
                // string deviceId = (string)deviceMessage["systemProperties"]["iothub-connection-device-id"];
                // var temperature = body["dht_temp"];
                // var humidity = body["dht_hum"];
                // var lm35_temp = body["lm35_temp"];
                // var spo2 = body["spo2"];
                // var bpm = body["bpm"];
                // var gps_lat = body["gps_lat"];
                // var gps_lng = body["gps_lng"];
                // var gps_alt = body["gps_alt"];
                // var gps_speed = body["gps_speed"];
                // var acc_x = body["acc_x"];
                // var acc_y = body["acc_y"];
                // var acc_z = body["acc_z"];
                // var gyro_x = body["gyro_x"];
                // var gyro_y = body["gyro_y"];
                // var gyro_z = body["gyro_z"];


                // Update twin with sensor data
                var updateTwinData = new JsonPatchDocument();
                updateTwinData.AppendReplace("/dht_hum", dht_hum);
                updateTwinData.AppendReplace("/dht_temp", dht_temp);
                updateTwinData.AppendReplace("/lm35_temp", lm35_temp);
                updateTwinData.AppendReplace("/spo2", spo2);
                updateTwinData.AppendReplace("/bpm", bpm);
                updateTwinData.AppendReplace("/gps_lat", gps_lat);
                updateTwinData.AppendReplace("/gps_lng", gps_lng);
                updateTwinData.AppendReplace("/gps_alt", gps_alt);
                updateTwinData.AppendReplace("/gps_speed", gps_speed);
                updateTwinData.AppendReplace("/acc_x", acc_x);
                updateTwinData.AppendReplace("/acc_y", acc_y);
                updateTwinData.AppendReplace("/acc_z", acc_z);
                updateTwinData.AppendReplace("/gyro_x", gyro_x);
                updateTwinData.AppendReplace("/gyro_y", gyro_y);
                updateTwinData.AppendReplace("/gyro_z", gyro_z);

                string deviceId = "esp32Device";

                await client.UpdateDigitalTwinAsync(deviceId, updateTwinData);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error in ingest function: {ex.Message}");
        }
    }
}
}