# Scout Drop Spec

## Feature

Scout Drop lets the user drop Clawd onto a location in the voxel county map.

## Input

- countySlug
- nodeId or locationLabel
- businessType
- goal
- budget optional
- serviceRadius optional

## Output

Scout report:
- selected location
- scout route
- opportunity signals
- risks
- recommended ad channels
- best offer
- next actions
- upgrade prompt if saving/tracking requires Hosted Clawd

## Signal types

- Residential Demand
- Commercial Foot Traffic
- B2B Outreach
- Partnership Target
- Event Promotion
- Low Competition
- High Competition
- High Willingness to Pay
- Fast Route Access
- Permit/Compliance Check
- Local Group Posting
- QR Flyer Opportunity
- Property Manager Outreach
- Google Business Profile Opportunity

## First demo

Drop Clawd in Eastvale for a mobile detailing business.

Expected output:
- Eastvale highlighted
- scout route toward Corona/Norco/Riverside corridor
- top signals: Residential Demand, Fast Route Access, QR Flyer Opportunity, Property Manager Outreach
- best offer: intro mobile detail package
- campaign: QR flyer + local group post + property manager DM + route plan
