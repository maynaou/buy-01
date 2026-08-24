=== khay mohcin marhba bik f readme file ===

--> just run compose file conntainers ghykhdmo rashom (si7r abro)

--->  t9dar tchof logs dyal ay service b  ( $ docker compose logs -f ) + smiya dyal service so kon derna docker mn lwl makntich ghtl9a mochkil bach t9ra logs alm3aks

*** Worning ***
ila bedlti chihaja bla mat3lem ghndi elik nadra khayba :) 

===have a good day===


discovery-service :8761
security-service  :8084
user-service      :8081
product-service   :8082
media-service     :8083
kafka             :9092
mongodb           :27017

                    ┌──────────────────┐
                    │     Angular      │
                    │    localhost     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   API Gateway    │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
   User Service       Product Service     Media Service
      :8081               :8082              :8083
          │                  │                  │
          └──────────┬───────┴───────┬──────────┘
                     │               │
                     ▼               ▼
                ┌─────────┐      ┌─────────┐
                │ MongoDB │      │  Kafka  │
                │ :27017  │      │  :9092  │
                └─────────┘      └─────────┘
                                      │
                                      ▼
                              productTopic
                              mediaTopic

                     ┌──────────────────┐
                     │ Eureka Discovery │
                     │      :8761       │
                     └──────────────────┘