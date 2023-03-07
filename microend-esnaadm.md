As an extension of the Esnaad application, EsnaadM is designed to assist pilots and technicians while they are away from the base during deployment. This will allow them to continue recording missions, aircraft hours, cycles, and landings. This is helpful so that when the aircraft returns to base, information about the hours flown, any faults that occurred, and the mission can be synchronized to the esnaad.

EsnaadM is now operational and is utilized on a regular basis by JAC, particularly by VIPs. On the other hand, there is a demand for EsnaadM to be applicable not only to the roles of pilots and technicians, but also to all aspects of operation, maintenance, and logistics.

The existing esnaadm software makes it difficult to realize this goal, which is unfortunate because it would help meet these needs. At the moment, EsnaadM is constructed as a monolith, which indicates that the features contained within esnaadm are extremely intertwined with one another. We need EsnaadM to have the capability of developing in a modular fashion, and we need a data architecture that is capable of supporting offline distributed systems.

As a result, the purpose of this paper is to describe the steps that need to be taken in order to turn esnaadm into a distributed, offline, and modular system.

What exactly is the point of using EsnaadM?
1. Even when they are in a remote location, pilots are able to keep track of their flight and mission hours.
2. Technician has the ability to monitor faults, record faults, and fix faults
3. The EsnaadM system is able to produce faults based on a due schedule inspection in accordance with the total number of aircraft hours, landings, or cycles recorded by pilots when they are carrying out missions.
4. EsnaadM is able to generate encrypted export data, which can then be sent to base. This ensures that the system at base is kept up to date with information regarding pilot hours and aircraft hours, as well as the maintenance and inspection schedule that is contained in EsnaadM.

The following are some of EsnaadM's deficiencies:
1. Installing software updates provided by esnaadm can only be done online once the laptop has returned to its home base.
2. Because the functions of esnaadm cannot be installed in a modular fashion, the size of the esnaadm software continues to expand, despite the fact that users of esnaadm do not require all of the features that esnaadm has to offer.
3. In the event that data merging produces a conflict, there is no mechanism for semantic reconciliation (also known as Resolution Delegation). This causes esnaadm and esnaad to experience frequent failures in their attempts to synchronize with one another.
4. In order to function, EsnaadM must be installed on a laptop running the Windows operating system.

Which of the following are some suggestions for improving EsnaadM:
1. Constructing esnaadm with an architecture that allows for the installation of esnaadm features in a modular fashion both offline and online.
2. Constructing EsnaadM in such a way that it is compatible with mobile operating systems such as Android, iOS, and Windows tablets;
3. The data in esnaadm need to have a vector version in order for us to be able to use the delegate resolution mechanism in the event that there is a conflict between the data. This will allow us to resolve the conflict.