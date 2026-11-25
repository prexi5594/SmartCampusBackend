"""Build an explicitly assumed Gate A route from connected mapped paths.
No field-verification flags or live GPS network are changed.
"""
from pathlib import Path
import json, math, heapq
ROOT=Path(__file__).resolve().parents[1]
SCALE=111195

def distance(a,b):
    return math.hypot((a[0]-b[0])*math.cos(math.radians((a[1]+b[1])/2)),a[1]-b[1])*SCALE

def project(p,a,b):
    dx,dy=b[0]-a[0],b[1]-a[1]
    t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy))) if dx or dy else 0
    q=[a[0]+t*dx,a[1]+t*dy]
    return distance(p,q),q

def inside(p,ring):
    hit=False
    for a,b in zip(ring,ring[1:]):
        if (a[1]>p[1])!=(b[1]>p[1]) and p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]:hit=not hit
    return hit

def simplified_indices(points,left,right,tolerance=8):
    if right<=left+1:return [left,right]
    d,i=max((project(points[i],points[left],points[right])[0],i) for i in range(left+1,right))
    if d<=tolerance:return [left,right]
    return simplified_indices(points,left,i,tolerance)[:-1]+simplified_indices(points,i,right,tolerance)

def main():
    geo=json.loads((ROOT/'prototype/data/usiu-geography.geojson').read_text())
    directory=json.loads((ROOT/'prototype/data/usiu-directory.json').read_text())
    gate=next(g['coordinates'] for g in directory['gates'] if g['id']=='gate-a')
    science=next(f for f in geo['features'] if f['id']=='way/1075687895')
    ring=science['geometry']['coordinates'][0]
    buildings=[f['geometry']['coordinates'][0] for f in geo['features'] if f['properties']['kind']=='building']
    nodes={};graph={};source_edges={};excluded=0
    for feature in geo['features']:
        if feature['properties']['kind']!='path':continue
        tags=feature['properties']['osmTags']
        if tags.get('foot')=='no' or tags.get('access') in ['private','no']:continue
        ids=feature['properties']['nodeIds'];coords=feature['geometry']['coordinates']
        for i,n in enumerate(ids):nodes[n]=coords[i];graph.setdefault(n,[])
        for a,b in zip(ids,ids[1:]):
            # Exclude segments visibly inside mapped buildings, even in assumption mode.
            samples=[[nodes[a][0]+(nodes[b][0]-nodes[a][0])*t/10,nodes[a][1]+(nodes[b][1]-nodes[a][1])*t/10] for t in range(11)]
            if any(inside(p,r) for p in samples for r in buildings):excluded+=1;continue
            w=distance(nodes[a],nodes[b]);graph[a].append((b,w));graph[b].append((a,w))
            source_edges[(a,b)]=source_edges[(b,a)]=feature['id']
    eligible=[n for n in nodes if graph[n]]
    start=min(eligible,key=lambda n:distance(nodes[n],gate))
    costs={start:0};previous={};queue=[(0,start)]
    while queue:
        cost,a=heapq.heappop(queue)
        if cost!=costs[a]:continue
        for b,w in graph[a]:
            if cost+w<costs.get(b,float('inf')):costs[b]=cost+w;previous[b]=a;heapq.heappush(queue,(cost+w,b))
    goal=min(costs,key=lambda n:min(project(nodes[n],a,b)[0] for a,b in zip(ring,ring[1:])))
    approach_distance,entrance=min(project(nodes[goal],a,b) for a,b in zip(ring,ring[1:]))
    ids=[goal]
    while ids[-1]!=start:ids.append(previous[ids[-1]])
    ids.reverse();coordinates=[nodes[n] for n in ids]
    indices=simplified_indices(coordinates,0,len(coordinates)-1)
    def bearing(a,b):return math.degrees(math.atan2((b[0]-a[0])*math.cos(math.radians(a[1])),b[1]-a[1]))
    checkpoints=[]
    for k,i in enumerate(indices):
        instruction='Follow the highlighted campus path.'
        if k==0:instruction='From Gate A, join the highlighted campus path and head into campus.'
        elif k==len(indices)-1:instruction='At the Science Centre approach, locate the glass entrance and staircase shown in the indoor guide. The entrance pin is estimated.'
        else:
            angle=(bearing(coordinates[indices[k-1]],coordinates[i])-bearing(coordinates[i],coordinates[indices[k+1]])+180)%360-180
            if abs(angle)>25:instruction='Bear '+('left' if angle>0 else 'right')+' at this mapped bend and follow the highlighted path.'
        checkpoints.append({'id':'outdoor-'+str(k),'coordinate':coordinates[i],'routeIndex':i,'label':'Gate A path' if k==0 else 'Science Centre approach' if k==len(indices)-1 else 'Path checkpoint '+str(k),'instruction':instruction,'metresToNext':round(sum(distance(coordinates[q],coordinates[q+1]) for q in range(i,indices[k+1]))) if k+1<len(indices) else None})
    result={'schemaVersion':1,'id':'gate-a-science-lab-h-pilot','status':'owner-authorised-assumptions','verified':False,'livePositioning':False,'destination':'Lab H','floor':'First floor','gateCoordinate':gate,'entranceCoordinate':entrance,'entranceBasis':'Estimated nearest Science Centre footprint edge to the connected mapped path; match the actual glass doorway on arrival.','pathAssumption':'Owner instructed treating existing mapped pathways as accurate on 2026-11-24. Access and exact entrance are not field-surveyed.','coordinates':coordinates,'nodeIds':ids,'sourceWays':[source_edges[(a,b)] for a,b in zip(ids,ids[1:])],'distanceMetres':round(costs[goal]+distance(gate,nodes[start])+approach_distance),'walkMinutes':round((costs[goal]+distance(gate,nodes[start])+approach_distance)/75,1),'durationBasis':'Outdoor estimate at 75 metres/minute; indoor time excluded.','connectors':[{'coordinates':[gate,nodes[start]],'status':'assumed-gate-connection'},{'coordinates':[nodes[goal],entrance],'status':'estimated-entrance-connection'}],'checkpoints':checkpoints,'floorAssumption':'Ground and floor 2 reuse the schematic first-floor corridor at owner request. Room count, outlines and positions are illustrative; only Lab H has a confirmed label and floor.','floors':[{'id':'ground','label':'Ground floor','basis':'assumed-repeat'},{'id':'1','label':'First floor','basis':'video-derived-schematic'},{'id':'2','label':'Floor 2','basis':'assumed-repeat'}]}
    (ROOT/'prototype/data/gate-a-science-pilot.json').write_text(json.dumps(result,indent=2)+'\n')
    print(f'Prepared {len(ids)} mapped nodes, {len(checkpoints)} outdoor checkpoints, ~{result["distanceMetres"]} m; excluded {excluded} building-intersecting segments.')
if __name__=='__main__':main()
