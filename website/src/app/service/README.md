I built this path thinking a service might have more than one prefix, which it
turns out isn't the case.
Instead, a single prefix can have multiple services
(e.g. apigateway could mean "API Gateway Management" or "API Gateway Management V2").
I'm retaining this route in case AWS bifurcates a service into two prefixes.
Until then, this route is allowed to be useless and/or broken.
